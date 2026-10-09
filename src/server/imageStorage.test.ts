import { beforeEach, describe, expect, test, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import {
  createUploadSignature,
  IMAGE_FOLDER,
  IMAGE_TRANSFORMATION,
  isStoredImageUrl,
  storeImage,
} from "./imageStorage";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(() => ({
      cloud_name: "test-cloud",
      api_key: "test-key",
      api_secret: "test-secret",
    })),
    uploader: { upload: vi.fn() },
    utils: { api_sign_request: vi.fn(() => "test-signature") },
  },
}));

const upload = vi.mocked(cloudinary.uploader.upload);
const storedUrl =
  "https://res.cloudinary.com/test-cloud/image/upload/v1/vocapp/abc.jpg";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isStoredImageUrl", () => {
  test("is true for an image in our cloud", () => {
    expect(isStoredImageUrl(storedUrl, "test-cloud")).toBe(true);
  });

  test.each([
    ["another cloud", "https://res.cloudinary.com/other-cloud/image/a.jpg"],
    [
      "a cloud with the same prefix",
      "https://res.cloudinary.com/test-cloud2/a.jpg",
    ],
    ["another host", "https://example.com/test-cloud/a.jpg"],
    ["plain http", "http://res.cloudinary.com/test-cloud/image/a.jpg"],
    ["an invalid url", "not a url"],
    ["an empty string", ""],
  ])("is false for %s", (_, url) => {
    expect(isStoredImageUrl(url, "test-cloud")).toBe(false);
  });

  test("is false when the cloud name is empty", () => {
    expect(isStoredImageUrl(storedUrl, "")).toBe(false);
  });
});

describe("storeImage", () => {
  test.each([
    ["an empty url", ""],
    ["an already stored url", storedUrl],
  ])("passes through %s without uploading", async (_, url) => {
    expect(await storeImage(url)).toBe(url);
    expect(upload).not.toHaveBeenCalled();
  });

  test("copies an external image to Cloudinary", async () => {
    upload.mockResolvedValue({ secure_url: storedUrl } as UploadApiResponse);

    const result = await storeImage("https://example.com/cat.jpg");

    expect(result).toBe(storedUrl);
    expect(upload).toHaveBeenCalledWith("https://example.com/cat.jpg", {
      folder: IMAGE_FOLDER,
      raw_transformation: IMAGE_TRANSFORMATION,
      resource_type: "image",
    });
  });

  test("sends IMAGE_TRANSFORMATION to the upload API unchanged", async () => {
    const { v2: actualCloudinary } = await vi.importActual<
      typeof import("cloudinary")
    >("cloudinary");
    // Not in the SDK's type definitions: builds the params the SDK sends to the upload API
    const { build_upload_params } = actualCloudinary.utils as unknown as {
      build_upload_params: (options: unknown) => { transformation?: string };
    };
    upload.mockResolvedValue({ secure_url: storedUrl } as UploadApiResponse);

    await storeImage("https://example.com/cat.jpg");

    const options = upload.mock.calls[0]?.[1];
    expect(build_upload_params(options).transformation).toBe(
      IMAGE_TRANSFORMATION
    );
  });

  test.each([
    ["a local file path", "/etc/passwd"],
    ["a file url", "file:///etc/passwd"],
    ["a data url", "data:image/png;base64,iVBORw0KGgo="],
    ["text that is not a url", "cat picture"],
  ])("rejects %s without uploading", async (_, url) => {
    const error = await storeImage(url).catch((e) => e);

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("BAD_REQUEST");
    expect(upload).not.toHaveBeenCalled();
  });

  test("turns an upload failure into a BAD_REQUEST error", async () => {
    upload.mockRejectedValue({ message: "Resource not found", http_code: 400 });

    const error = await storeImage("https://example.com/gone.jpg").catch(
      (e) => e
    );

    expect(error).toBeInstanceOf(TRPCError);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.message).toContain("Resource not found");
  });
});

describe("createUploadSignature", () => {
  test("signs exactly the params the browser sends to Cloudinary", () => {
    const result = createUploadSignature();

    expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
      {
        timestamp: result.timestamp,
        folder: IMAGE_FOLDER,
        transformation: IMAGE_TRANSFORMATION,
      },
      "test-secret"
    );
    expect(result).toEqual({
      cloudName: "test-cloud",
      apiKey: "test-key",
      timestamp: expect.any(Number),
      folder: IMAGE_FOLDER,
      transformation: IMAGE_TRANSFORMATION,
      signature: "test-signature",
    });
  });
});

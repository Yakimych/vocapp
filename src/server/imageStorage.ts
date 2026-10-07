import { TRPCError } from "@trpc/server";
import { v2 as cloudinary } from "cloudinary";

export const IMAGE_FOLDER = "vocapp";
export const IMAGE_TRANSFORMATION = "c_limit,w_1200,h_1200";

const getCloudName = () => cloudinary.config().cloud_name ?? "";

export const isStoredImageUrl = (url: string, cloudName: string) => {
  try {
    const { protocol, hostname, pathname } = new URL(url);
    return (
      cloudName.length > 0 &&
      protocol === "https:" &&
      hostname === "res.cloudinary.com" &&
      pathname.startsWith(`/${cloudName}/`)
    );
  } catch {
    return false;
  }
};

const isHttpUrl = (url: string) => {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
    if ("error" in error) {
      return getErrorMessage(error.error);
    }
  }
  return String(error);
};

export const storeImage = async (sourceUrl: string): Promise<string> => {
  if (sourceUrl === "" || isStoredImageUrl(sourceUrl, getCloudName())) {
    return sourceUrl;
  }
  // The Cloudinary SDK reads anything that is not a remote URL from the local file system
  if (!isHttpUrl(sourceUrl)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Image URL must be an http(s) link: ${sourceUrl}`,
    });
  }

  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      folder: IMAGE_FOLDER,
      // A plain `transformation` string would be read as a named transformation
      raw_transformation: IMAGE_TRANSFORMATION,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Couldn't copy image from ${sourceUrl}: ${getErrorMessage(
        error
      )}`,
    });
  }
};

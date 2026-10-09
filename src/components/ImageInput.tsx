import { ChangeEvent, useState } from "react";
import { trpc } from "../utils/trpc";
import { TextField } from "./TextField";

// Cloudinary free plan limit for a single image
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type CloudinaryUploadResponse =
  | { secure_url: string }
  | { error: { message: string } };

type Props = {
  imageUrl: string;
  tabIndex?: number;
  onImageUrlChange: (imageUrl: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
};

export const ImageInput = ({
  imageUrl,
  tabIndex,
  onImageUrlChange,
  onUploadingChange,
}: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { mutateAsync: signImageUpload } = trpc.useMutation([
    "vocabulary.signImageUpload",
  ]);

  const setUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange(uploading);
  };

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError("The image must be 10 MB or smaller");
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const {
        cloudName,
        apiKey,
        timestamp,
        folder,
        transformation,
        signature,
      } = await signImageUpload(undefined);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("folder", folder);
      formData.append("transformation", transformation);
      formData.append("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const result: CloudinaryUploadResponse = await response.json();
      if ("error" in result) {
        throw new Error(result.error.message);
      }

      onImageUrlChange(result.secure_url);
    } catch (error) {
      setUploadError(
        `Couldn't upload the image: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const onFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so that selecting the same file again triggers onChange
    e.target.value = "";
    if (file) {
      uploadFile(file);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex">
        <TextField
          tabIndex={tabIndex}
          placeholder="Image URL (optional)"
          value={imageUrl}
          disabled={isUploading}
          onTextChange={(value) => {
            setUploadError(null);
            onImageUrlChange(value);
          }}
        />
        <label
          className={`${
            isUploading
              ? "bg-gray-300"
              : "bg-violet-500 hover:bg-violet-700 cursor-pointer"
          } text-white font-bold py-1.5 px-3 rounded whitespace-nowrap`}
        >
          {isUploading ? "Uploading..." : "Upload file"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={onFileSelected}
          />
        </label>
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Image preview"
          className="h-16 object-contain self-start mt-1"
          onLoad={(e) => (e.currentTarget.style.visibility = "visible")}
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
        />
      ) : null}
      {uploadError ? <div className="text-red-700">{uploadError}</div> : null}
    </div>
  );
};

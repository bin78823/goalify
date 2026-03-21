import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@goalify/ui";

interface ImageUploadProps {
  value?: string;
  onChange: (base64: string | undefined) => void;
  maxSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface ValidationError {
  type: "size" | "type" | "dimension";
  message: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  maxSize = 2 * 1024 * 1024,
  maxWidth = 512,
  maxHeight = 512,
  acceptedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  className,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<ValidationError | null>(null);

  const validateFile = useCallback(
    (file: File): ValidationError | null => {
      if (!acceptedTypes.includes(file.type)) {
        return {
          type: "type",
          message: t("imageUpload.error.type", {
            types: acceptedTypes
              .map((t) => t.split("/")[1].toUpperCase())
              .join(", "),
          }),
        };
      }

      if (file.size > maxSize) {
        return {
          type: "size",
          message: t("imageUpload.error.size", {
            size: `${maxSize / (1024 * 1024)}MB`,
          }),
        };
      }

      return null;
    },
    [acceptedTypes, maxSize, t],
  );

  const validateDimensions = useCallback(
    (img: HTMLImageElement): ValidationError | null => {
      if (img.naturalWidth > maxWidth || img.naturalHeight > maxHeight) {
        return {
          type: "dimension",
          message: t("imageUpload.error.dimension", {
            width: maxWidth,
            height: maxHeight,
          }),
        };
      }
      return null;
    },
    [maxWidth, maxHeight, t],
  );

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;

        const img = new Image();
        img.onload = () => {
          const dimensionError = validateDimensions(img);
          if (dimensionError) {
            setError(dimensionError);
            return;
          }
          setError(null);
          onChange(result);
        };
        img.onerror = () => {
          setError({ type: "type", message: t("imageUpload.error.invalid") });
        };
        img.src = result;
      };
      reader.onerror = () => {
        setError({ type: "type", message: t("imageUpload.error.read") });
      };
      reader.readAsDataURL(file);
    },
    [validateFile, validateDimensions, onChange, t],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile],
  );

  const handleRemove = useCallback(() => {
    onChange(undefined);
    setError(null);
  }, [onChange]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  if (value) {
    return (
      <div className={cn("relative group", className)}>
        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[var(--border)]">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="mt-2 text-xs text-[var(--vibrant-blue)] hover:text-[var(--vibrant-blue)]/80 font-medium"
        >
          {t("imageUpload.replace")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative w-20 h-20 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-[var(--vibrant-blue)] bg-[var(--vibrant-blue)]/5"
            : "hover:border-[var(--vibrant-blue)]/50 hover:bg-[var(--secondary)]/50",
        )}
      >
        <ImageIcon className="w-6 h-6 text-[var(--muted-foreground)]" />
        <span className="text-[10px] text-[var(--muted-foreground)] mt-1">
          {t("imageUpload.upload")}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error.message}</p>}
    </div>
  );
};

export default ImageUpload;

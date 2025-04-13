import React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription, // Added for potential use
} from "@/components/ui/dialog";
import { Button } from "./button";
import { X } from "lucide-react";

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null; // Renamed from imageUrl for clarity
  fileName: string | null;
  fileType: string | null; // Added fileType prop
}

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType, // Destructure fileType
}) => {
  if (!fileUrl || !fileType) return null;

  const isImage = fileType.startsWith("image/");
  const isVideo = fileType.startsWith("video/");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[80vw] md:max-w-[60vw] lg:max-w-[50vw] xl:max-w-[40vw] h-[80vh] flex flex-col p-0 fixed right-4 top-1/2 transform -translate-y-1/2"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside if needed, or allow default behavior
          // e.preventDefault(); // Uncomment to prevent closing on outside click
        }}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="truncate">
            {fileName || "Preview"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
          {isImage ? (
            <Image
              src={fileUrl}
              alt={fileName || "Attachment Preview"}
              width={1000} // Adjust width/height based on expected max size or use layout fill
              height={800}
              style={{
                objectFit: "contain",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
              unoptimized // If using external URLs or blob URLs extensively
            />
          ) : isVideo ? (
            <video
              src={fileUrl}
              controls
              style={{ maxWidth: "100%", maxHeight: "100%" }}
              preload="metadata" // Load metadata quickly
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-center text-muted-foreground">
              Preview not available for this file type ({fileType}).
            </div>
          )}
        </div>
        {/* Optional Footer */}
        {/* <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};

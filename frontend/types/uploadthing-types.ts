export type OurFileRouter = {
  taskAttachment: {
    image: {
      maxFileSize: string;
      maxFileCount: number;
    };
    video: {
      maxFileSize: string;
      maxFileCount: number;
    };
    audio: {
      maxFileSize: string;
      maxFileCount: number;
    };
    pdf: {
      maxFileSize: string;
      maxFileCount: number;
    };
    text: {
      maxFileSize: string;
      maxFileCount: number;
    };
    blob: {
      maxFileSize: string;
      maxFileCount: number;
    };
  };
};

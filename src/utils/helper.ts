import { Response } from "express";

export const send = (res: Response) => {
  return {
    ok(data: any) {
      return res.status(200).json({
        success: true,
        data,
      });
    },
    error(error?: any, status = 400) {
      // Auto-detect 500-level errors if needed
      const isServerError = status >= 500;
      return res.status(status).json({
        success: false,
        error:
          typeof error === "string"
            ? error
            : error?.message || "Error occurred",
        ...(isServerError
          ? {
              stack:
                process.env.NODE_ENV === "development"
                  ? error?.stack
                  : undefined,
            }
          : {}),
      });
    },
  };
};

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  code: string | undefined;
  fieldErrors: FieldErrors;

  constructor(
    status: number,
    code: string | undefined,
    fieldErrors: FieldErrors,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

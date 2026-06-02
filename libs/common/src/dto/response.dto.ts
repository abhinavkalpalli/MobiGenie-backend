export class ResponseDto<T> {
  success!: boolean;
  message!: string;
  data?: T;
  error?: string;

  static success<T>(data: T, message = 'Success'): ResponseDto<T> {
    return { success: true, message, data };
  }

  static error(error: string, message = 'Error'): ResponseDto<null> {
    return { success: false, message, error };
  }
}

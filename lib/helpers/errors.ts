export const formatError = (
  status: number,
  message: string,
  errSource: string,
  error: Error | null
) => {
  const err = {
    status,
    message,
    name: error?.name,
    cause: error?.message,
  };
  console.error(`Error: ${errSource} ---->`, error);
  return err;
};

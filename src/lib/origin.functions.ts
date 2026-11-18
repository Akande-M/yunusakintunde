import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

/** The public origin of this request (e.g. https://yunusakintunde.com), for absolute share/preview links. */
export const getOrigin = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return getRequestUrl({ xForwardedHost: true }).origin;
  } catch {
    return "";
  }
});

import Fastify from "fastify";
import { LAEL, type LaelOptions } from "../core/index.js";
import { registerRoutes } from "./routes.js";

export async function buildServer(options: LaelOptions = {}) {
  const lael = new LAEL(options);
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });
  app.addHook("onRequest", async (request, reply) => {
    reply.header("access-control-allow-origin", "*");
    reply.header("access-control-allow-methods", "GET,POST,PATCH,OPTIONS");
    reply.header("access-control-allow-headers", "content-type,authorization");
    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }
    return undefined;
  });
  await registerRoutes(app, lael);

  app.addHook("onClose", async () => {
    lael.close();
  });

  return { app, lael };
}

export async function startServer(options: LaelOptions = {}): Promise<void> {
  const { app } = await buildServer(options);
  const host = process.env.LAEL_HOST ?? (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
  const port = Number(process.env.LAEL_PORT ?? process.env.PORT ?? 3000);
  await app.listen({ host, port });
}

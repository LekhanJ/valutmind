import app from "./app";
import { connectRabbit } from "./lib/rabbitmq";

await connectRabbit();

Bun.serve({
    port: Number(process.env.PORT ?? 3001),
    fetch: app.fetch,
});

console.log(`auth-service listening on port ${process.env.PORT ?? 3001}`);

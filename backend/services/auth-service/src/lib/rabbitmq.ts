import amqp from "amqplib";

let channel: amqp.Channel | undefined;

/**
 * Routing keys currently published:
 *   user.created
 *   user.logged_in
 *   email.verification_requested
 *   email.verified
 *   password.reset_requested
 *   password.changed
 */
export async function connectRabbit() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);

    channel = await connection.createChannel();

    await channel.assertExchange("vaultmind.events", "topic", { durable: true });

    connection.on("close", () => {
        console.error("RabbitMQ connection closed");
        channel = undefined;
    });

    connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err.message);
    });
}

export function getChannel(): amqp.Channel {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized — call connectRabbit() first");
    }
    return channel;
}
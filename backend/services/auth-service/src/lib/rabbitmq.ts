import amqp from "amqplib";

let channel: amqp.Channel | undefined;

export async function connectRabbit() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);

    channel = await connection.createChannel();

    await channel.assertExchange("vaultmind.events", "topic", { durable: true });

    connection.on("close", () => {
        console.error("RabbitMQ connection closed");
        channel = undefined;
    });
}

export function getChannel(): amqp.Channel {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized — call connectRabbit() first");
    }
    return channel;
}

import amqp from "amqplib"

let channel: amqp.Channel;

export async function connectRabbit() {
    const connection = await amqp.connect(process.env.RABBITMQ_URL!);

    channel = await connection.createChannel();

    await channel.assertExchange("vaultmind.events", "topic", { durable: true });
}

export function getChannel() {
    return channel;
}
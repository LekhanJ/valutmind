import { getChannel } from "./rabbitmq";

export async function publishEvent(routingKey: string, payload: unknown) {
    const channel = getChannel();

    channel.publish(
        "vaultmind.events",
        routingKey,
        Buffer.from(
            JSON.stringify(payload)
        )
    );
}
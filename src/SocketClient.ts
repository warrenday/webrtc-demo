import * as Ably from "ably";

const ably = new Ably.Realtime("oMf5LQ.WeNt-w:5OMPsYDEm81uQyGj");

type EventName = "message";
type EventCallback = (data: object, fullMessage: object) => void;

export class Channel {
  private channel: Ably.Types.RealtimeChannelCallbacks;
  private callbacks: { name: EventName; cb: EventCallback }[] = [];

  constructor(channelName: string) {
    this.channel = ably.channels.get(`client-connect-channel-${channelName}`);

    this.channel.subscribe((message) => {
      if (message.connectionId !== ably.connection.id) {
        this.callbacks.forEach((callback) => {
          if (message.name === callback.name) {
            callback.cb(JSON.parse(message.data), message);
          }
        });
      }
    });
  }

  on(name: EventName, cb: EventCallback) {
    const newCallback = { name, cb };
    this.callbacks.push(newCallback);
    return () => {
      this.callbacks = this.callbacks.filter(
        (callback) => callback !== newCallback
      );
    };
  }

  send(name: EventName, message: object) {
    this.channel.publish(name, JSON.stringify(message));
  }
}

export class SocketClient {
  channels: { [key: string]: Channel };

  connect(channelName: string) {
    return new Channel(channelName);
  }
}

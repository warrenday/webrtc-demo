import SimplePeer from "simple-peer";
import { SocketClient, Channel } from "./SocketClient";

type EventName = "connect" | "data";
type EventCallback = (data?: object) => void;

export class MessagingClient {
  private isHost: boolean;
  private peerClient: SimplePeer;
  private socketClient = new SocketClient();
  private callbacks: { name: EventName; cb: EventCallback }[] = [];

  private createPeerClient(isHost, establishChannel: Channel) {
    let peerClient = new SimplePeer({
      initiator: isHost,
      trickle: true,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
        ],
      },
    });
    peerClient._debug = console.log;
    this.peerClient = peerClient;
    console.log("creating new peer");

    // Handshake
    peerClient.on("signal", (data) => {
      establishChannel.send("message", { rtcHandshake: data });
    });
    const endHandshakeListener = establishChannel.on(
      "message",
      (data: { rtcHandshake: any }) => {
        if (data.rtcHandshake) {
          peerClient.signal(data.rtcHandshake);
        }
      }
    );

    // Cleanup on disconnect
    peerClient.on("error", () => {
      endHandshakeListener();
      peerClient.destroy();
      this.peerClient = undefined;
      console.log("client disconnected");
    });

    // RTC messages
    peerClient.on("connect", () => {
      this.callbacks.forEach((callback) => {
        if (callback.name === "connect") {
          callback.cb();
        }
      });
    });
    peerClient.on("data", (message) => {
      this.callbacks.forEach((callback) => {
        if (callback.name === "data") {
          callback.cb(JSON.parse(message));
        }
      });
    });
  }

  host(channelName: string) {
    this.isHost = true;
    const channel = this.socketClient.connect(channelName);

    channel.on("message", (message: { joined: boolean }) => {
      if (message.joined) {
        console.log("got joined message");
        this.createPeerClient(this.isHost, channel);
      }
    });
  }

  join(channelName: string) {
    this.isHost = false;
    const channel = this.socketClient.connect(channelName);
    this.createPeerClient(this.isHost, channel);

    channel.send("message", { joined: true });
  }

  on(event: "data" | "connect", cb) {
    this.callbacks.push({ name: event, cb });
  }

  send(message) {
    if (this.peerClient) {
      this.peerClient.send(JSON.stringify(message));
    }
  }
}

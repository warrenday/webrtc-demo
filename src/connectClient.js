const ably = new Ably.Realtime("oMf5LQ.WeNt-w:5OMPsYDEm81uQyGj");

export class ConnectClient {
  channel = ably.channels.get("client-connect-channel");

  constructor(isInitiator) {
    this.isInitiator = isInitiator;
    this.onMessageCallbacks = [];

    this.channel.subscribe("connect", (message) => {
      if (message.connectionId !== ably.connection.id) {
        console.log("received:", message.data);
        this.onMessageCallbacks.forEach((cb) => {
          cb(JSON.parse(message.data));
        });
      }
    });
  }

  establish = (cb) => {
    const isInitiator = this.isInitiator;

    let established = false;
    const complete = () => {
      if (!established) {
        established = true;
        cb();
      }
    };

    this.onMessage((data) => {
      if (isInitiator) {
        if (data.ping && !data.isInitiator) {
          console.log("client connected");
          complete();
        }
      } else {
        if (data.ping && data.isInitiator) {
          this.send({ ping: true, isInitiator });
        }
      }
    });

    this.send({ ping: true, isInitiator });

    if (!isInitiator) {
      console.log("I am the client and I am alive");
      complete();
    }
  };

  send = (payload) => {
    return this.channel.publish("connect", JSON.stringify(payload));
  };

  onMessage = (cb) => {
    this.onMessageCallbacks.push(cb);
  };
}

import qs from "qs";
import SimplePeer from "simple-peer";
import { ConnectClient } from "./connectClient";

const { init, channel } = qs.parse(window.location.search.replace("?", ""));

const isInitiator = init === "1";
const connectClient = new ConnectClient(isInitiator, channel);

connectClient.establish(() => {
  const p = new SimplePeer({
    initiator: isInitiator,
    trickle: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
      ],
    },
  });

  p.on("error", (err) => console.error(err));
  p.on("signal", (data) => {
    console.log("signal...");
    connectClient.send({ rtc: data });
  });

  connectClient.onMessage((data) => {
    if (data.rtc) {
      p.signal(data.rtc);
    }
  });

  // Once connected

  p.on("connect", () => {
    console.log("WebRTC Connected");
    document.getElementById("status").innerHTML = "Connected!";

    const input = document.querySelector("#message");
    input.addEventListener("input", (e) => {
      p.send(
        JSON.stringify({ date: new Date().getTime(), message: e.target.value })
      );
    });
  });

  p.on("data", (data) => {
    try {
      const res = JSON.parse(data);
      const { date, message } = res;
      const now = new Date().getTime();
      console.log({ diff: now - Number(date), message });
    } catch (e) {
      console.error(e);
    }
  });
});

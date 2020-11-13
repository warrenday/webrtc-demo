import qs from "qs";
import { MessagingClient } from "./MessagingClient";

const { host, channel } = qs.parse(window.location.search.replace("?", ""));
const isHost = host === "1";

const client = new MessagingClient();

client.on("connect", () => {
  document.getElementById("status").innerHTML =
    "WebRTC Connected! Open your console!";

  const input = document.querySelector("#message");
  input.addEventListener("input", (event) => {
    client.send({ message: (<HTMLInputElement>event.target).value });
  });
});

client.on("data", (message) => {
  console.log(message);
});

if (isHost) {
  client.host(channel);
} else {
  client.join(channel);
}

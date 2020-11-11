import SimplePeer from "simple-peer";

const p = new SimplePeer({
  initiator: location.hash === "#1",
  trickle: false,
});

p.on("error", (err) => console.log("error", err));

p.on("signal", (data) => {
  console.log("SIGNAL", JSON.stringify(data));
  document.querySelector("#outgoing").textContent = JSON.stringify(data);
});

document.querySelector("form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  p.signal(JSON.parse(document.querySelector("#incoming").value));
});

p.on("connect", () => {
  console.log("CONNECT");

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

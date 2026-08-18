import QRCode from "qrcode";

export async function renderQR(container, text) {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: 168,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `QR code linking to ${text}`);
  container.appendChild(canvas);
}

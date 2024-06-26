export function fillCircle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  stroke = true
): void {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  if (stroke) {
    context.stroke();
  }
}

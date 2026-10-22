/* Centspire V5 — icon set (carried over from V3, extended).
 * Every icon is a list of SVG path strings on a 24×24 grid, drawn as 1.75px rounded strokes.
 * Paths only (no <circle>/<rect>) so the same data can be drawn on the share-image canvas.
 */
(function (root) { root.Centsible = root.Centsible || {}; root.Centsible.Icons = (() => {
  const circle = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const rect = (x, y, w, h, r = 0) => r
    ? `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
    : `M${x} ${y}h${w}v${h}h${-w}Z`;

  const P = {
    // card art
    form: [rect(5, 3, 14, 18, 2), 'M9 8h6M9 12h6M9 16h2', 'M13.5 16.5l1.5 1.5 3-3'],
    gradcap: ['M2 9.5 12 5l10 4.5-10 4.5z', 'M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5', 'M22 9.5V15'],
    bus: [rect(4, 3, 16, 14, 2.5), 'M4 10h16', 'M7.5 13.5h.01M16.5 13.5h.01', 'M7 17v3M17 17v3'],
    award: [circle(12, 9, 5.5), 'M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5'],
    bank: ['M3 9.5 12 4l9 5.5z', 'M5 12v5M9.67 12v5M14.33 12v5M19 12v5', 'M3 20.5h18'],
    coffee: ['M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z', 'M16 11h1.5a2.5 2.5 0 0 1 0 5H16', 'M8 3.5v2.5M12 3.5v2.5'],
    briefcase: [rect(3, 7, 18, 13, 2), 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7', 'M3 13h18'],
    utensils: ['M6 3v6a2 2 0 0 0 4 0V3', 'M8 3v18', 'M18 21V3c-2.5 0-4 3-4 7h4'],
    book: ['M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5', 'M12 6.5C14 5 17 4.5 21 5v13c-4-.5-7 0-9 1.5', 'M12 6.5v13'],
    card: [rect(2.5, 5, 19, 14, 2), 'M2.5 10h19', 'M6 15h4'],
    plane: ['M21 3 3 10.5l7 2.5 2.5 7z', 'M10 13 21 3'],
    building: [rect(5, 3, 14, 18, 1.5), 'M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01', 'M10.5 21v-3h3v3'],
    coins: ['M5 6a7 2.5 0 1 0 14 0a7 2.5 0 1 0-14 0', 'M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6', 'M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4', 'M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4'],
    calendar: [rect(3, 5, 18, 16, 2), 'M3 10h18M8 3v4M16 3v4', 'M7.5 14h3M7.5 17.5h6'],
    car: ['M5 11.5l1.8-4.5A2 2 0 0 1 8.7 5.5h6.6a2 2 0 0 1 1.9 1.5L19 11.5', rect(3, 11.5, 18, 5, 1.5), circle(7.5, 18.5, 1.5), circle(16.5, 18.5, 1.5)],
    phone: [rect(6.5, 2.5, 11, 19, 2.5), 'M11 18.5h2', 'M9.5 6l2.5 2.5-1.5 2 3 2.5'],
    // meters + UI
    wallet: [rect(3, 6, 18, 13, 2.5), 'M15 10.5h6v4h-6a2 2 0 0 1 0-4z', 'M6 6l9-3 1.5 3'],
    heart: ['M12 20s-7.5-4.5-7.5-10.5A4.25 4.25 0 0 1 12 7a4.25 4.25 0 0 1 7.5 2.5C19.5 15.5 12 20 12 20z'],
    receipt: ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 8h6M9 12h6M9 16h3'],
    bulb: ['M9 18h6M10 21h4', 'M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z'],
    calc: [rect(5, 3, 14, 18, 2), 'M8.5 7.5h7', 'M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01'],
    bookmark: ['M6.5 3h11v18L12 17l-5.5 4z'],
    notebook: [rect(5, 3, 14, 18, 2), 'M9 3v18', 'M12 8h4M12 12h4'],
    check: ['M5 12.5l4.5 4.5L19 7'],
    alert: ['M12 3.5 2.5 20h19z', 'M12 10v4.5', 'M12 17.5h.01'],
    x: ['M6 6l12 12M18 6 6 18'],
    arrowL: ['M19 12H5', 'M11 6l-6 6 6 6'],
    arrowR: ['M5 12h14', 'M13 6l6 6-6 6'],
    sound: ['M4 9.5h3.5L12 6v12l-4.5-3.5H4z', 'M15.5 9.5a3.5 3.5 0 0 1 0 5', 'M18 7a7 7 0 0 1 0 10'],
    mute: ['M4 9.5h3.5L12 6v12l-4.5-3.5H4z', 'M16 9.5l5 5M21 9.5l-5 5'],
    share: ['M12 15V3', 'M7.5 7.5 12 3l4.5 4.5', 'M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7'],
    link: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'],
    replay: ['M4 12a8 8 0 1 0 2.34-5.66', 'M4 3.5v4.5h4.5'],
    swipe: ['M4 12h16', 'M8 8l-4 4 4 4', 'M16 8l4 4-4 4'],
    user: [circle(12, 8, 4), 'M4.5 20.5a7.5 7.5 0 0 1 15 0'],
    chat: ['M4 5h16v11H10l-5 4v-4H4z'],
    mail: [rect(3, 5, 18, 14, 2), 'M3.5 6.5 12 13l8.5-6.5'],
    store: ['M3.5 9 5 4h14l1.5 5z', 'M5 9v11h14V9', 'M10 20v-5h4v5'],
    lock: [rect(5, 10.5, 14, 10, 2), 'M8 10.5V7.5a4 4 0 0 1 8 0v3'],
    unlock: [rect(5, 10.5, 14, 10, 2), 'M8 10.5V7.5a4 4 0 0 1 7.75-1.4'],
    star: ['M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z'],
    chart: ['M4 20V4', 'M4 20h16', 'M8 16v-4M12 16V8M16 16v-6'],
    home: ['M3.5 11 12 4l8.5 7', 'M6 9.5V20h12V9.5'],
    // added in V4
    play: ['M7 4.5v15l12-7.5z'],
    print: ['M7 9V3.5h10V9', rect(3.5, 9, 17, 8, 2), 'M7 14h10v6.5H7z'],
    clock: [circle(12, 12, 8.5), 'M12 7.5V12l3 2'],
    shield: ['M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z', 'M9 12l2.2 2.2L15.5 10'],
    target: [circle(12, 12, 8.5), circle(12, 12, 4.75), 'M12 12h.01'],
    trend: ['M3.5 17 9 11.5l4 4L20.5 8', 'M15 8h5.5v5.5'],
    external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10'],
    menu: ['M4 7h16M4 12h16M4 17h16'],
    presentation: [rect(3, 4, 18, 12, 1.5), 'M12 16v4M8 20.5h8'],
    // personalities
    acorn: ['M4 10.5a8 5 0 0 1 16 0z', 'M12 5.5V3', 'M6 10.5V12c0 3.9 2.7 7.5 6 9 3.3-1.5 6-5.1 6-9v-1.5'],
    search: [circle(10.5, 10.5, 6.5), 'M20 20l-4.8-4.8', 'M10.5 8v5M8 10.5h5'],
    rocket: ['M12 2.5c3 2.2 4.5 5.8 4.5 9.5l-1.5 4H9l-1.5-4c0-3.7 1.5-7.3 4.5-9.5z', circle(12, 9.5, 1.75), 'M7.5 12 5 16l3 .5', 'M16.5 12l2.5 4-3 .5', 'M10.5 19l1.5 2.5 1.5-2.5'],
    scale: ['M12 3.5v17', 'M8 20.5h8', 'M5 7h14', 'M5 7l-3 6.5a3 3 0 0 0 6 0z', 'M19 7l-3 6.5a3 3 0 0 0 6 0z'],
  };

  function svg(name, { size = 24, stroke = 1.75, cls = '' } = {}) {
    const paths = P[name] || P.star;
    return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
  }

  // Draw on a canvas: (x, y) is the top-left corner, size in px.
  function draw(ctx, name, x, y, size, color, stroke = 1.75) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = color;
    ctx.lineWidth = stroke;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    (P[name] || P.star).forEach((d) => ctx.stroke(new Path2D(d)));
    ctx.restore();
  }

  return { svg, draw, names: Object.keys(P) };
})();
  root.CentsibleIcons = root.Centsible.Icons;
})(typeof globalThis !== 'undefined' ? globalThis : this);

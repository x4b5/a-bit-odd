// Gedeeld door alle pagina's: de pixelletters van a-bit-odd en het tekenen van de mindmap.
// Letters op hetzelfde raster als maak_logo.py: 9 breed, 13 hoog
// (4 rijen stok boven de x-hoogte), plus 3 rijen staart voor g, j en p.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const ADVANCE = 11;      // letterafstand in pixels, gelijk aan het logo
  const GLYPH_HEIGHT = 16;

  const E = ".........";
  const x = (rows) => [E, E, E, E, ...rows, E, E, E];          // alleen x-hoogte
  const tall = (top, rows) => [...top, ...rows, E, E, E];      // met stok
  const tail = (top, rows, down) => [...top, ...rows, ...down]; // met staart
  const times = (row, n) => Array(n).fill(row);

  const ROUND = times("XX.....XX", 5);
  const GLYPHS = {
    a: x([".XXXXXXX.", ".XXXXXXXX", ".......XX", "..XXXXXXX", ".XXXXXXXX", "XX.....XX", "XX.....XX", "XXXXXXXXX", ".XXXXXXXX"]),
    b: tall(times("XX.......", 4), ["XXXXXXXX.", "XXXXXXXXX", ...ROUND, "XXXXXXXXX", "XXXXXXXX."]),
    c: x([".XXXXXXX.", "XXXXXXXXX", ...times("XX.......", 5), "XXXXXXXXX", ".XXXXXXX."]),
    d: tall(times(".......XX", 4), [".XXXXXXXX", "XXXXXXXXX", ...ROUND, "XXXXXXXXX", ".XXXXXXXX"]),
    e: x([".XXXXXXX.", "XXXXXXXXX", "XX.....XX", "XX.....XX", "XXXXXXXXX", "XXXXXXXXX", "XX.......", "XXXXXXXXX", ".XXXXXXXX"]),
    f: tall(["...XXXXX.", "..XXXXXX.", "..XX.....", "..XX....."], ["XXXXXXX..", "XXXXXXX..", ...times("..XX.....", 7)]),
    g: tail(times(E, 4), [".XXXXXXXX", "XXXXXXXXX", ...ROUND, "XXXXXXXXX", ".XXXXXXXX"], [".......XX", "XXXXXXXXX", "XXXXXXXX."]),
    h: tall(times("XX.......", 4), ["XXXXXXXX.", "XXXXXXXXX", ...times("XX.....XX", 7)]),
    i: tall([E, "...XX....", "...XX....", E], ["XXXXX....", "XXXXX....", ...times("...XX....", 5), "XXXXXXXXX", "XXXXXXXXX"]),
    j: tail([E, "......XX.", "......XX.", E], ["...XXXXX.", "...XXXXX.", ...times("......XX.", 7)], ["......XX.", "XXXXXXXX.", ".XXXXXX.."]),
    k: tall(times("XX.......", 4), ["XX....XX.", "XX...XX..", "XX..XX...", "XXXXX....", "XXXXX....", "XX..XX...", "XX...XX..", "XX....XX.", "XX.....XX"]),
    l: tall(["XXXXX....", "XXXXX....", "...XX....", "...XX...."], [...times("...XX....", 7), "XXXXXXXXX", "XXXXXXXXX"]),
    m: x(["XXXX.XXX.", "XXXXXXXXX", ...times("XX..X..XX", 7)]),
    n: x(["XXXXXXXX.", "XXXXXXXXX", ...ROUND, "XX.....XX", "XX.....XX"]),
    o: x([".XXXXXXX.", "XXXXXXXXX", ...ROUND, "XXXXXXXXX", ".XXXXXXX."]),
    p: tail(times(E, 4), ["XXXXXXXX.", "XXXXXXXXX", ...ROUND, "XXXXXXXXX", "XXXXXXXX."], times("XX.......", 3)),
    r: x(["XX.XXXXX.", "XXXXXXXXX", "XXX......", ...times("XX.......", 6)]),
    s: x([".XXXXXXXX", "XXXXXXXXX", "XX.......", "XXXXXXXX.", ".XXXXXXXX", ".......XX", ".......XX", "XXXXXXXXX", "XXXXXXXX."]),
    t: tall([E, ".XX......", ".XX......", ".XX......"], ["XXXXXXX..", "XXXXXXX..", ...times(".XX......", 5), ".XXXXXXX.", "..XXXXXX."]),
    u: x([...times("XX.....XX", 7), "XXXXXXXXX", ".XXXXXXXX"]),
    v: x([...times("XX.....XX", 4), "XXX...XXX", ".XX...XX.", ".XXX.XXX.", "..XXXXX..", "...XXX..."]),
    w: x([...ROUND, "XX..X..XX", "XX..X..XX", "XXXXXXXXX", ".XXX.XXX."]),
    z: x(["XXXXXXXXX", "XXXXXXXXX", ".....XXX.", "....XXX..", "...XXX...", "..XXX....", ".XXX.....", "XXXXXXXXX", "XXXXXXXXX"]),
    "-": x([E, E, E, "..XXXXX..", "..XXXXX..", E, E, E, E]),
  };

  const make = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  const point = (deg, r) => {
    const rad = (deg * Math.PI) / 180;
    return [Math.cos(rad) * r, Math.sin(rad) * r];
  };

  // Een woord als één pad van pixelvierkantjes, links-boven op (0,0)
  function pixelPath(word) {
    return [...word].flatMap((ch, j) =>
      (GLYPHS[ch] || []).flatMap((row, y) =>
        [...row].map((c, col) => (c === "X" ? `M${j * ADVANCE + col} ${y}h1v1h-1z` : "")).filter(Boolean)
      )
    ).join("");
  }

  const wordSize = (word, pixel) => ({
    width: (word.length * ADVANCE - 2) * pixel,
    height: GLYPH_HEIGHT * pixel,
  });

  // Een woord in pixelletters, gecentreerd op (cx, cy), met donkere ondergrond
  function pixelWord(word, cx, cy, pixel) {
    const { width, height } = wordSize(word, pixel);
    const left = cx - width / 2;
    const top = cy - height / 2;
    const g = make("g", {});
    g.appendChild(make("rect", { class: "pad", x: left - 2, y: top - 2, width: width + 4, height: height + 4 }));
    g.appendChild(make("path", {
      class: "letters",
      d: pixelPath(word),
      "shape-rendering": "crispEdges",
      transform: `translate(${left} ${top}) scale(${pixel})`,
    }));
    return g;
  }

  // Tekent draden vanuit het midden naar elk knooppunt.
  // node: { label, href?, angle, info? } — zonder href wordt het een grijs, niet-klikbaar knooppunt.
  function drawMindmap({ strandsLayer, nodesLayer, nodes, radius, pixel, onInfo = () => {} }) {
    nodes.forEach(({ label, href, angle, info = "" }) => {
      const [cx, cy] = point(angle, radius);
      const strand = make("line", { class: "strand", x1: 0, y1: 0, x2: cx, y2: cy });
      strandsLayer.appendChild(strand);

      const node = href
        ? make("a", { class: "node", href, "aria-label": info ? `${label}: ${info}` : label })
        : make("g", { class: "node off", tabindex: 0, "aria-label": info ? `${label}: ${info}` : label });
      node.appendChild(pixelWord(label, cx, cy, pixel));
      nodesLayer.appendChild(node);

      const on = () => { if (href) strand.style.stroke = "var(--red)"; onInfo(info); };
      const off = () => { strand.style.stroke = ""; onInfo(""); };
      node.addEventListener("mouseenter", on);
      node.addEventListener("focus", on);
      node.addEventListener("mouseleave", off);
      node.addEventListener("blur", off);
    });
  }

  window.Pixels = { pixelWord, drawMindmap };
})();

// script/PerlinNoise.js
// Egyszerűsített Perlin Noise implementáció (2D)
// TODO: Finomhangolás és optimalizálás szükséges lehet.
// TODO: Áttérés seed alapú generálásra?

// Permutációs tábla a reprodukálható zajhoz
const P = new Array(512);
const permutation = new Array(256);

// Inicializálás (kell egy random, de fix sorrend)
for (let i = 0; i < 256; i++) {
    permutation[i] = Math.floor(Math.random() * 256);
}

// Duplázzuk a táblát, hogy ne kelljen modulus operátor a keresésnél
for (let i = 0; i < 256; i++) {
    P[i] = P[i + 256] = permutation[i];
}

// Segédfüggvények
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
    return a + t * (b - a);
}

function grad(hash, x, y) {
    // A 12 gradiens vektor
    const h = hash & 0xF;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : 0);
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function perlin2D(x, y) {
    // Cellakoordináták
    let X = Math.floor(x) & 255;
    let Y = Math.floor(y) & 255;

    // Relatív koordináták a cellán belül
    x -= Math.floor(x);
    y -= Math.floor(y);

    // Fade Curves
    const u = fade(x);
    const v = fade(y);

    // Hash koordiáták (permutációs tábla használatával)
    const A = P[X] + Y;
    const B = P[X + 1] + Y;

    // Lineáris interpoláció
    const res = lerp(
        lerp(grad(P[A], x, y), grad(P[B], x - 1, y), u),
        lerp(grad(P[A + 1], x, y - 1), grad(P[B + 1], x - 1, y - 1), u),
        v
    );

    // Normalizálás 0 és 1 közé
    return (res + 1) / 2; 
}
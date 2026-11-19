import assert from "node:assert/strict";
import { test } from "node:test";
import { FallbackImage } from "../components/fallback-image";

function fixture(complete: boolean, naturalWidth: number) {
  return {
    src: "https://cdn.discordapp.com/avatars/example/missing.png",
    baseURI: "http://localhost:3000/",
    complete,
    naturalWidth,
  };
}

test("an image that failed before hydration switches to the local fallback on attachment", () => {
  const image = fixture(true, 0);
  const element = FallbackImage({ src: image.src, fallback: "/Logo.png", alt: "Founder" });
  element.props.ref(image);
  assert.equal(image.src, "http://localhost:3000/Logo.png");
  assert.equal(element.props.alt, "Founder");
});

test("healthy and still-loading avatars keep their original source", () => {
  const element = FallbackImage({ fallback: "/Logo.png" });
  for (const image of [fixture(true, 96), fixture(false, 0)]) {
    const source = image.src;
    element.props.ref(image);
    assert.equal(image.src, source);
  }
  element.props.ref(null);
});

test("a failed fallback is not repeatedly assigned", () => {
  const image = fixture(true, 0);
  const element = FallbackImage({ fallback: "/Logo.png" });
  element.props.ref(image);
  Object.defineProperty(image, "src", {
    get: () => "http://localhost:3000/Logo.png",
    set: () => assert.fail("The fallback must not be retried indefinitely"),
  });
  element.props.ref(image);
});

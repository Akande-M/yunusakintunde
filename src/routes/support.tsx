import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Facebook, Loader2, MessageCircle, Share2 } from "lucide-react";
import { getOrigin } from "@/lib/origin.functions";
import { useSiteImages } from "@/lib/use-settings";
import { canvasToBlob, drawSupportCard } from "@/lib/support-card";
import { btn, PageHeader } from "@/components/site/ui";

/** Pre-rendered copy of the card: shown before the live one is drawn, and used for link previews. */
const STATIC_CARD = "/support-card.jpg";
const TITLE = "I Support Senator Akintunde for 2027";
const SHARE_TEXT =
  "I SUPPORT Senator Yunus Abiodun Akintunde, PhD for 2027! Four years of delivery for Oyo Central. Show your support too:";

export const Route = createFileRoute("/support")({
  loader: () => getOrigin(),
  head: ({ loaderData: origin }) => {
    const image = origin ? `${origin}${STATIC_CARD}` : STATIC_CARD;
    return {
      meta: [
        { title: `${TITLE} | Akintunde 2027` },
        {
          name: "description",
          content:
            "Show your support for Senator Yunus Abiodun Akintunde, PhD. Share the card on WhatsApp, Facebook and X.",
        },
        { property: "og:title", content: TITLE },
        {
          property: "og:description",
          content: "Four years of delivery for Oyo Central. Show your support for 2027.",
        },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1080" },
        { property: "og:image:height", content: "1350" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
    };
  },
  component: Support,
});

function Support() {
  const origin = Route.useLoaderData();
  const images = useSiteImages();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<File | null>(null);
  const [preview, setPreview] = useState(STATIC_CARD);
  const [ready, setReady] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const pageUrl = `${origin || (typeof window !== "undefined" ? window.location.origin : "")}/support`;
  const shareMessage = `${SHARE_TEXT} ${pageUrl}`;

  useEffect(() => {
    let alive = true;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      await drawSupportCard(canvas, {
        photoUrl: images.supportPhoto,
        apcLogoUrl: images.supportApc,
        sealUrl: images.supportSeal,
        // Print the real domain on the card, never a local or preview address.
        siteHost: /^(localhost|127\.|\[::1\])/.test(window.location.host)
          ? ""
          : window.location.host,
      });
      const blob = await canvasToBlob(canvas);
      if (!alive || !blob) return;
      const file = new File([blob], "i-support-senator-akintunde-2027.jpg", { type: "image/jpeg" });
      fileRef.current = file;
      setPreview(URL.createObjectURL(blob));
      setCanShareFiles(
        typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }),
      );
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [images.supportPhoto, images.supportApc, images.supportSeal]);

  function download() {
    const file = fileRef.current;
    if (!file) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /** Shares the actual image through the phone's share sheet (WhatsApp, Instagram, Facebook…). */
  async function shareImage() {
    const file = fileRef.current;
    if (!file) return;
    if (canShareFiles) {
      setBusy(true);
      try {
        await navigator.share({ files: [file], title: TITLE, text: shareMessage });
      } catch {
        /* user closed the share sheet */
      } finally {
        setBusy(false);
      }
    } else {
      download();
    }
  }

  async function whatsapp() {
    // On phones, send the image itself. On computers, WhatsApp only accepts text,
    // so send the message + link (its preview shows the card).
    if (canShareFiles) return shareImage();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank", "noopener");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked */
    }
  }

  const share = (url: string) => window.open(url, "_blank", "noopener,width=640,height=560");
  const iconBtn = `${btn.outline} justify-start`;

  return (
    <>
      <PageHeader
        eyebrow="Akintunde 2027"
        title="Show your support"
        lede="Share the card with your family, friends and WhatsApp groups. Every share tells Oyo Central you are standing with Senator Akintunde for 2027."
      />
      <section className="py-12 sm:py-14">
        <div className="wrap grid items-start gap-10 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          <figure className="mx-auto w-full max-w-[480px]">
            <div className="relative overflow-hidden rounded-lg border border-border bg-primary-deep shadow-[0_24px_60px_-24px_rgba(18,52,36,.45)]">
              <img
                src={preview}
                alt="I SUPPORT SENATOR AKINTUNDE FOR 2027. Senator Yunus Abiodun Akintunde, PhD, Senator for Oyo Central Senatorial District, All Progressives Congress."
                width={1080}
                height={1350}
                className="block aspect-[4/5] w-full object-cover"
              />
              {!ready && (
                <span className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-card/90">
                  <Loader2 className="size-4 animate-spin text-primary" />
                </span>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" aria-hidden />
          </figure>

          <div>
            <h2 className="font-serif text-[28px] leading-tight font-semibold text-primary-deep">
              Share it in one tap
            </h2>
            <p className="mt-2 max-w-[52ch] text-[15px] text-muted-foreground">
              {canShareFiles
                ? "Tap “Share image” and pick WhatsApp, your Status, Facebook or Instagram. The card goes as a picture."
                : "Download the card to post it as a picture, or share the link. The link shows the card as its preview."}
            </p>

            <div className="mt-6 grid gap-3 sm:max-w-md">
              <button
                type="button"
                onClick={() => void shareImage()}
                disabled={!ready || busy}
                className={`${btn.gold} text-[15px]`}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                {canShareFiles ? "Share image" : "Download the card"}
              </button>
              <button
                type="button"
                onClick={() => void whatsapp()}
                disabled={!ready}
                className={iconBtn}
              >
                <MessageCircle className="size-4 text-[#25D366]" /> Share on WhatsApp
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() =>
                    share(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
                    )
                  }
                >
                  <Facebook className="size-4 text-[#1877F2]" /> Facebook
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  onClick={() =>
                    share(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(pageUrl)}`,
                    )
                  }
                >
                  <span aria-hidden className="text-[15px] font-black">
                    𝕏
                  </span>{" "}
                  Post on X
                </button>
              </div>
              <div className={`grid gap-3 ${canShareFiles ? "grid-cols-2" : ""}`}>
                {canShareFiles && (
                  <button type="button" className={iconBtn} onClick={download} disabled={!ready}>
                    <Download className="size-4" /> Download
                  </button>
                )}
                <button type="button" className={iconBtn} onClick={() => void copyLink()}>
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy message with link"}
                </button>
              </div>
            </div>

            <div className="mt-10 rounded-lg border border-border bg-paper-2 p-6 sm:max-w-md">
              <h3 className="font-serif text-[20px] font-semibold text-primary-deep">
                Want to do more?
              </h3>
              <p className="mt-1.5 text-[14px] text-muted-foreground">
                Volunteer, host a town hall in your ward, or get campaign updates.
              </p>
              <Link to="/get-involved" className={`${btn.primary} mt-4`}>
                Join the campaign
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

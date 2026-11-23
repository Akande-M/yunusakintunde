import { createFileRoute, redirect } from "@tanstack/react-router";

/* The old Record & Agenda page was split: the promise tracker and 2027 agenda now live on
   /achievements, and the projects list on the Infrastructure Projects page. Old links keep working. */
export const Route = createFileRoute("/record-agenda")({
  beforeLoad: () => {
    throw redirect({ to: "/achievements", hash: "promises", statusCode: 301 });
  },
});

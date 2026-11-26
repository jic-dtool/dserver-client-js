import { describe, it, expect } from "vitest";
import { DServerClient } from "../src/client";

function node(i: number) {
  return { uuid: `uuid-${i}`, name: `dataset-${i}`, derived_from: [] };
}

/** A fake dserver serving a graph of `total` datasets in pages. */
function fakeServer(total: number) {
  const calls: { url: string; method: string; body?: string }[] = [];
  const fetchImpl = async (url: string, options: RequestInit) => {
    calls.push({ url, method: options.method!, body: options.body as string });
    const params = new URL(url).searchParams;
    const page = Number(params.get("page"));
    const pageSize = Number(params.get("page_size"));
    const nodes = Array.from({ length: total }, (_, i) => node(i));
    const data = nodes.slice((page - 1) * pageSize, page * pageSize);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "X-Pagination": JSON.stringify({
          total,
          total_pages: pages,
          page,
          first_page: 1,
          last_page: pages,
        }),
      },
    });
  };
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

describe("getDependencyGraph", () => {
  it("fetches every page", async () => {
    const { calls, fetchImpl } = fakeServer(250);
    const client = new DServerClient({
      baseUrl: "https://dserver.example.org",
      token: "t",
      fetch: fetchImpl,
    });

    const graph = await client.getDependencyGraph("uuid-0");

    expect(graph).toHaveLength(250);
    expect(graph[249].uuid).toBe("uuid-249");
    expect(calls.map((c) => new URL(c.url).searchParams.get("page"))).toEqual(
      ["1", "2", "3"],
    );
    expect(calls.every((c) => c.method === "GET")).toBe(true);
  });

  it("uses one request for small graphs", async () => {
    const { calls, fetchImpl } = fakeServer(9);
    const client = new DServerClient({
      baseUrl: "https://dserver.example.org",
      token: "t",
      fetch: fetchImpl,
    });
    expect(await client.getDependencyGraph("uuid-0")).toHaveLength(9);
    expect(calls).toHaveLength(1);
  });

  it("posts custom dependency keys", async () => {
    const { calls, fetchImpl } = fakeServer(1);
    const client = new DServerClient({
      baseUrl: "https://dserver.example.org",
      token: "t",
      fetch: fetchImpl,
    });
    await client.getDependencyGraph("uuid-0", ["annotations.source"]);
    expect(calls[0].method).toBe("POST");
    expect(JSON.parse(calls[0].body!)).toEqual({
      dependency_keys: ["annotations.source"],
    });
  });
});

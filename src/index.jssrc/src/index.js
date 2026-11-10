
const SOURCES = [
  {
    name: "The Standard",
    url: "https://www.standardmedia.co.ke/rss/headlines.php"
  },
  {
    name: "Nation Africa",
    url: "https://nation.africa/kenya/rss.xml"
  },
  {
    name: "Nairobi Leo",
    url: "https://nairobileo.co.ke/feed/news"
  }
];

const TOPIC_RULES = [
  {
    category: "Politics & Governance",
    keywords: /\b(president|presidency|parliament|mp\b|mps\b|senator|governor|government|politic|election|electoral|iebc|political party|cabinet|minister|state house|county assembly|governance|bill|legislation|court ruling|judiciary|supreme court|impeach|opposition|coalition|by-election)\b/i
  },
  {
    category: "Sports",
    keywords: /\b(football|soccer|premier league|epl|champions league|afcon|fifa|uefa|goal|match|fixture|tournament|athlete|athletics|rugby|cricket|basketball|volleyball|tennis|marathon|olympic|sport|sporting|fkf|gor mahia|afc leopards|harambee stars|shujaa)\b/i
  },
  {
    category: "Music",
    keywords: /\b(music|musician|singer|song|album|rapper|rap music|concert|artist|afrobeats|gospel music|music video|record label|grammy|dj\b|deejay|gengetone|benga)\b/i
  },
  {
    category: "Entertainment",
    keywords: /\b(entertainment|celebrity|actor|actress|film|movie|cinema|television|tv show|reality show|comedian|comedy|showbiz|red carpet|fashion week|influencer|netflix|hollywood|nollywood)\b/i
  },
  {
    category: "Technology & Innovation",
    keywords: /\b(technology|tech\b|artificial intelligence|\\bAI\\b|software|startup|digital|cybersecurity|cyber attack|hacking|mobile app|smartphone|internet|telecommunications|fintech|innovation|robotics|cloud computing|data breach|machine learning|social media platform|electric vehicle|blockchain)\b/i
  },
  {
    category: "Finance & Economics",
    keywords: /\b(economy|economic|inflation|interest rate|central bank|cbk\b|exchange rate|shilling|currency|forex|stock market|stocks|shares|bonds|treasury bills|treasury bonds|tax revenue|public debt|budget deficit|gdp\b|monetary policy|fiscal policy|cost of living|nse\b|capital markets|banking|bank profits|financial markets)\b/i
  },
  {
    category: "Business & Entrepreneurship",
    keywords: /\b(business|entrepreneur|entrepreneurship|company|companies|corporate|ceo\b|merger|acquisition|investment|investor|startup funding|small business|sme\b|enterprise|retail|manufacturing|trade|export|import|industry|market expansion|business deal|job creation)\b/i
  },
  {
    category: "Education & Careers",
    keywords: /\b(education|school|university|college|student|students|teacher|lecturer|examination|exam|kcse|kcpe|knec|kuccps|helb|scholarship|graduation|curriculum|employment|unemployment|job vacancy|recruitment|career|training|internship)\b/i
  },
  {
    category: "Health & Wellness",
    keywords: /\b(health|hospital|doctor|nurse|patient|patients|medical|medicine|disease|illness|outbreak|epidemic|pandemic|vaccination|vaccine|pharmacy|healthcare|mental health|nutrition|surgery|maternal health|ministry of health)\b/i
  },
  {
    category: "Agriculture & Environment",
    keywords: /\b(agriculture|farming|farmer|farmers|livestock|crop|harvest|fertilizer|fertiliser|food security|drought|flood|rainfall|climate change|environment|conservation|wildlife|forestry|deforestation|irrigation|fisheries|maize|tea farmers|coffee farmers)\b/i
  },
  {
    category: "Science & Research",
    keywords: /\b(science|scientific|research|researchers|scientist|scientists|discovery|laboratory|experiment|space exploration|astronomy|nasa\b|spacex|genetics|biotechnology|physics|chemistry|biology|clinical trial|study finds|scientific study)\b/i
  },
  {
    category: "Religion & Spirituality",
    keywords: /\b(church|churches|pastor|bishop|priest|christian|christianity|muslim|islam|mosque|imam|religion|religious|faith|spiritual|worship|sermon|clergy|interfaith|religious leader)\b/i
  },
  {
    category: "Culture & Society",
    keywords: /\b(culture|cultural|society|community|communities|tradition|heritage|tribe|tribal|ethnic|custom|customs|social issue|human rights|gender|equality|inequality|discrimination|family|marriage|population|demographic|humanitarian|civil society)\b/i
  },
  {
    category: "Lifestyle & Travel",
    keywords: /\b(lifestyle|travel|tourism|tourist|tourists|hotel|hotels|holiday|vacation|destination|destinations|restaurant|restaurants|food|recipe|cuisine|fashion|beauty|wedding|relationship|home decor|adventure|national park|safari)\b/i
  }
];

function classifyCategory(title, description) {
  const text = `${title || ""} ${description || ""}`;

  for (const rule of TOPIC_RULES) {
    if (rule.keywords.test(text)) {
      return rule.category;
    }
  }

  return "News & Current Affairs";
}

function decodeEntities(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    );
}

function cleanText(value = "") {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(
    new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}\\s*>`, "i")
  );

  return match ? match[1].trim() : "";
}

function getAtomLink(block) {
  const match = block.match(
    /<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i
  );
  return match ? decodeEntities(match[1]) : "";
}

function parseFeed(xml, sourceName) {
  const entries = xml.match(/<(item|entry)\b[^>]*>[\s\S]*?<\/\1\s*>/gi) || [];

  return entries.map((entry) => {
    const title = cleanText(getTag(entry, "title"));
    const rawDescription =
      getTag(entry, "description") ||
      getTag(entry, "content:encoded") ||
      getTag(entry, "summary") ||
      getTag(entry, "content");

    const description = cleanText(rawDescription).slice(0, 500);

    const url =
      decodeEntities(getTag(entry, "link")) ||
      getAtomLink(entry) ||
      decodeEntities(getTag(entry, "guid") || getTag(entry, "id"));

    const publishedAt =
      getTag(entry, "pubDate") ||
      getTag(entry, "published") ||
      getTag(entry, "updated") ||
      getTag(entry, "dc:date");

    const date = publishedAt ? new Date(publishedAt) : null;

    if (!title || !url || !/^https?:\/\//i.test(url)) {
      return null;
    }

    return {
      id: url,
      publisher: sourceName,
      title,
      url,
      publishedAt:
        date && !Number.isNaN(date.getTime())
          ? date.toISOString()
          : null,
      category: classifyCategory(title, description),
      language: "en",
      description
    };
  }).filter(Boolean);
}

async function fetchSource(source) {
  try {
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "jeSocial-News/1.0",
        "Accept": "application/rss+xml, application/xml, text/xml, */*"
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const articles = parseFeed(xml, source.name);

    return {
      articles,
      status: {
        name: source.name,
        status: "success",
        count: articles.length
      }
    };
  } catch (error) {
    return {
      articles: [],
      status: {
        name: source.name,
        status: "failed",
        count: 0,
        error: error.message || "Unable to fetch feed"
      }
    };
  }
}

async function getNews() {
  const results = await Promise.all(SOURCES.map(fetchSource));

  const sourceStatuses = results.map((result) => result.status);

  const uniqueArticles = new Map();

  for (const result of results) {
    for (const article of result.articles) {
      const normalizedUrl = article.url
        .replace(/\/$/, "")
        .split("?")[0];

      if (!uniqueArticles.has(normalizedUrl)) {
        uniqueArticles.set(normalizedUrl, article);
      }
    }
  }

  const articles = Array.from(uniqueArticles.values()).sort(
    (a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
  );

  const successfulSources = sourceStatuses.filter(
    (source) => source.status === "success"
  ).length;

  const failedSources = sourceStatuses.filter(
    (source) => source.status === "failed"
  ).length;

  return {
    service: "jeSocial News API",
    generatedAt: new Date().toISOString(),
    count: articles.length,
    successfulSources,
    failedSources,
    sources: sourceStatuses,
    articles
  };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (request.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: CORS_HEADERS
        }
      );
    }

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          service: "jeSocial News API",
          status: "online",
          endpoints: ["/health", "/news"],
          sources: SOURCES.length
        }),
        { headers: CORS_HEADERS }
      );
    }

    if (url.pathname !== "/news") {
      return new Response(
        JSON.stringify({
          error: "Not found",
          availableEndpoints: ["/health", "/news"]
        }),
        {
          status: 404,
          headers: CORS_HEADERS
        }
      );
    }

    try {
      const cache = caches.default;
      const cacheKey = new Request(
        new URL("/news", request.url).toString(),
        { method: "GET" }
      );

      const cached = await cache.match(cacheKey);

      if (cached) {
        const headers = new Headers(cached.headers);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("X-jeSocial-Cache", "HIT");

        return new Response(cached.body, {
          status: cached.status,
          headers
        });
      }

      const data = await getNews();

      const response = new Response(JSON.stringify(data), {
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "public, max-age=300",
          "X-jeSocial-Cache": "MISS"
        }
      });

      ctx.waitUntil(cache.put(cacheKey, response.clone()));

      return response;
    } catch (error) {
      return new Response(
        JSON.stringify({
          service: "jeSocial News API",
          error: "Unable to retrieve news",
          details: error.message
        }),
        {
          status: 500,
          headers: CORS_HEADERS
        }
      );
    }
  }
};

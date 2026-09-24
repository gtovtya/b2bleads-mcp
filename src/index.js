import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const API_BASE_URL = process.env.B2BLEADS_API_URL || "https://api.b2bleadsapi.com"
const API_KEY = process.env.B2BLEADS_API_KEY

const INDUSTRIES = [
  "construction",
  "restaurants",
  "retail",
  "manufacturing",
  "logistics",
  "it_services",
  "healthcare",
  "real_estate",
  "hospitality",
  "professional_services",
]

const SEARCH_LEADS_TOOL = {
  name: "search_leads",
  description:
    "Search for companies and business contacts in real time by industry, city, and other filters. " +
    "Returns a ready-to-use list of leads (name, address, phone, website, rating, and email where available). " +
    "Use this whenever the user asks to find, list, or collect businesses/companies for sales, outreach, or research.",
  inputSchema: {
    type: "object",
    properties: {
      q: {
        type: "string",
        description: "Free-text search query, e.g. \"construction companies in Munich\". Optional if industry+city are given.",
      },
      industry: {
        type: "string",
        enum: INDUSTRIES,
        description: "Industry filter. One of the predefined categories.",
      },
      city: {
        type: "string",
        description: "City or region to search in, e.g. \"Berlin\" or \"Austin, TX\".",
      },
      radius_km: {
        type: "number",
        description: "Search radius in kilometers around the city center.",
      },
      min_rating: {
        type: "number",
        description: "Minimum rating (0-5) a business must have to be included.",
      },
      has_website: {
        type: "boolean",
        description: "Only return businesses that have a website.",
      },
      verified_only: {
        type: "boolean",
        description: "Only return businesses with a verified listing.",
      },
      open_now: {
        type: "boolean",
        description: "Only return businesses that are currently open.",
      },
      price_level: {
        type: "string",
        enum: ["budget", "moderate", "expensive", "luxury"],
        description: "Filter by price level.",
      },
      rank_by: {
        type: "string",
        enum: ["relevance", "distance"],
        description: "How to sort results.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        description: "Max number of results to return (1-20). Defaults to a server-side value if omitted.",
      },
      lang: {
        type: "string",
        description: "Result language as a BCP-47 tag, e.g. \"en\" or \"pt-BR\".",
      },
      page_token: {
        type: "string",
        description: "Pagination token returned by a previous call, to fetch the next page of results.",
      },
      save_to_list: {
        type: "boolean",
        description: "If true, also save the results into a B2BLeads saved list (requires list_id or list_name).",
      },
      list_id: {
        type: "string",
        description: "Existing saved-list ID to append results to.",
      },
      list_name: {
        type: "string",
        description: "Name of a saved list to find-or-create and append results to.",
      },
    },
  },
}

const LIST_INDUSTRIES_TOOL = {
  name: "list_industries",
  description: "List the predefined industry categories that can be used as the `industry` filter in search_leads.",
  inputSchema: { type: "object", properties: {} },
}

function requireApiKey() {
  if (!API_KEY) {
    throw new Error(
      "Missing B2BLeads API key. Set the B2BLEADS_API_KEY environment variable — get a key at https://b2bleadsapi.com/app/api-keys"
    )
  }
}

async function callSearchLeads(args) {
  requireApiKey()
  const url = new URL("/v1/search-leads", API_BASE_URL)
  for (const [key, value] of Object.entries(args || {})) {
    if (value === undefined || value === null || value === "") continue
    url.searchParams.set(key, String(value))
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `B2BLeads API request failed with status ${res.status}`)
  }
  return body
}

async function callListIndustries() {
  const url = new URL("/v1/search-leads/industries", API_BASE_URL)
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `B2BLeads API request failed with status ${res.status}`)
  }
  return body
}

const server = new Server(
  { name: "b2bleads-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEARCH_LEADS_TOOL, LIST_INDUSTRIES_TOOL],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  try {
    let result
    if (name === "search_leads") {
      result = await callSearchLeads(args)
    } else if (name === "list_industries") {
      result = await callListIndustries()
    } else {
      throw new Error(`Unknown tool: ${name}`)
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    }
  }
})

export async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

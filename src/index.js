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

const LIST_SAVED_LISTS_TOOL = {
  name: "list_saved_lists",
  description:
    "List all of the user's saved lead lists (read-only), each with its full set of saved leads. " +
    "Use this when the user asks what they've already saved, or which lists exist.",
  inputSchema: { type: "object", properties: {} },
}

const GET_SAVED_LIST_TOOL = {
  name: "get_saved_list",
  description: "Get one saved lead list by ID, including its full set of saved leads (read-only).",
  inputSchema: {
    type: "object",
    properties: {
      list_id: {
        type: "string",
        description: "The saved list's ID, from list_saved_lists or a search_leads save_to_list response.",
      },
    },
    required: ["list_id"],
  },
}

const FIND_EMAIL_TOOL = {
  name: "find_email",
  description:
    "Look up a best-effort contact email for a single business website (checks the homepage and common contact pages). " +
    "Use this for one specific website, e.g. from a saved list or CSV, rather than re-running search_leads. " +
    "May return a null email if none could be found; this tool never fabricates an address.",
  inputSchema: {
    type: "object",
    properties: {
      website: {
        type: "string",
        description: "The business website URL to look up a contact email for, e.g. \"https://example.com\".",
      },
    },
    required: ["website"],
  },
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

async function callListSavedLists() {
  requireApiKey()
  const url = new URL("/v1/search-leads/lists", API_BASE_URL)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `B2BLeads API request failed with status ${res.status}`)
  }
  return body
}

async function callGetSavedList(args) {
  requireApiKey()
  const listId = args?.list_id
  if (!listId) throw new Error("list_id is required")
  const url = new URL(`/v1/search-leads/lists/${encodeURIComponent(listId)}`, API_BASE_URL)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `B2BLeads API request failed with status ${res.status}`)
  }
  return body
}

async function callFindEmail(args) {
  requireApiKey()
  const website = args?.website
  if (!website) throw new Error("website is required")
  const url = new URL("/v1/search-leads/find-email", API_BASE_URL)
  url.searchParams.set("website", website)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${API_KEY}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `B2BLeads API request failed with status ${res.status}`)
  }
  return body
}

const server = new Server(
  { name: "b2bleads-mcp", version: "1.3.0" },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [SEARCH_LEADS_TOOL, LIST_INDUSTRIES_TOOL, LIST_SAVED_LISTS_TOOL, GET_SAVED_LIST_TOOL, FIND_EMAIL_TOOL],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  try {
    let result
    if (name === "search_leads") {
      result = await callSearchLeads(args)
    } else if (name === "list_industries") {
      result = await callListIndustries()
    } else if (name === "list_saved_lists") {
      result = await callListSavedLists()
    } else if (name === "get_saved_list") {
      result = await callGetSavedList(args)
    } else if (name === "find_email") {
      result = await callFindEmail(args)
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

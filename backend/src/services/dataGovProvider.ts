import axios from 'axios';

const DATA_GOV_BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

export interface DataGovRecord {
  State: string;
  District: string;
  Market: string;
  Commodity: string;
  Variety: string;
  Grade: string;
  Arrival_Date: string;
  'Min_x0020_Price': string;
  'Max_x0020_Price': string;
  'Modal_x0020_Price': string;
}

export interface DataGovResponse {
  records: DataGovRecord[];
  total: number;
  count: number;
  offset: number;
  limit: number;
}

export interface FetchOptions {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  limit?: number;
  offset?: number;
}

export class DataGovProvider {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.DATA_GOV_API_KEY || null;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  async fetchPrices(options: FetchOptions = {}): Promise<DataGovResponse> {
    if (!this.isConfigured()) {
      throw new Error('DATA_GOV_API_KEY is not configured');
    }

    const params: Record<string, string | number> = {
      'api-key': this.apiKey!,
      format: 'json',
      limit: options.limit ?? 500,
      offset: options.offset ?? 0,
    };

    if (options.state) params['filters[State]'] = options.state;
    if (options.district) params['filters[District]'] = options.district;
    if (options.market) params['filters[Market]'] = options.market;
    if (options.commodity) params['filters[Commodity]'] = options.commodity;
    if (options.variety) params['filters[Variety]'] = options.variety;

    const response = await axios.get<DataGovResponse>(DATA_GOV_BASE_URL, {
      params,
      timeout: 30000,
    });

    return response.data;
  }

  async fetchAllPagesForState(state: string): Promise<DataGovRecord[]> {
    const allRecords: DataGovRecord[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const data = await this.fetchPrices({ state, limit, offset });
      allRecords.push(...data.records);

      if (allRecords.length >= data.total || data.records.length < limit) {
        break;
      }

      offset += limit;

      // Rate limiting: wait 1s between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return allRecords;
  }

  parseDate(dateStr: string): Date {
    // Format: DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
    }
    return new Date(dateStr);
  }

  parsePrice(priceStr: string): number {
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  }
}

export const dataGovProvider = new DataGovProvider();

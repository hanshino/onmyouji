import axios, { AxiosInstance } from "axios";

export type LineApiConfig = {
  channelAccessToken: string;
  baseUrl?: string;
};

export class Line {
  private channelAccessToken: string;
  private baseUrl: string = "https://api-data.line.me";
  private axiosInstance: AxiosInstance;
  constructor(config: LineApiConfig) {
    this.channelAccessToken = config.channelAccessToken;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }

    const axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
    });
    this.axiosInstance = axiosInstance;
  }

  async getMessageContent(messageId: string): Promise<Buffer> {
    const response = await this.axiosInstance.get(
      `/v2/bot/message/${messageId}/content`,
      {
        responseType: "arraybuffer",
      }
    );
    return response.data;
  }
}

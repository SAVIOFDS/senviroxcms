export interface IDatabasePort {
  ping(): Promise<boolean>;
  isConfigured(): boolean;
}

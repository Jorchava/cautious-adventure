export interface IScene {
  init(): Promise<void>
  destroy(options?: { children?: boolean; texture?: boolean }): void
}

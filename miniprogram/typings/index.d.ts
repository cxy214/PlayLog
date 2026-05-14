interface IAppOption {
  globalData: Record<string, unknown>;
}

declare namespace WechatMiniprogram {
  namespace App {
    interface Constructor {
      <T extends IAppOption>(options: T): void;
    }
  }

  namespace Page {
    interface Constructor {
      <TData extends Record<string, unknown>>(options: {
        data?: TData;
        [key: string]: unknown;
      }): void;
    }
  }
}

declare const App: WechatMiniprogram.App.Constructor;
declare const Page: WechatMiniprogram.Page.Constructor;

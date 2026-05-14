interface IAppOption {
  globalData: Record<string, unknown>;
  onLaunch?: () => void;
}

type CloudFunctionResult<T = unknown> = {
  result?: T;
};

declare const wx: {
  cloud?: {
    init(options: { env?: string; traceUser?: boolean }): void;
    callFunction<T = unknown>(options: {
      name: string;
      data?: Record<string, unknown>;
      success?: (res: CloudFunctionResult<T>) => void;
      fail?: (error: { errMsg?: string }) => void;
      complete?: () => void;
    }): void;
  };
  showToast(options: {
    title: string;
    icon?: "success" | "error" | "loading" | "none";
    duration?: number;
  }): void;
};

declare namespace WechatMiniprogram {
  namespace App {
    interface Constructor {
      <T extends IAppOption>(options: T): void;
    }
  }

  namespace Page {
    type Instance<TData extends Record<string, unknown>> = {
      data: TData;
      setData(data: Partial<TData>): void;
    };

    interface Constructor {
      <TData extends Record<string, unknown>>(
        options: {
          data?: TData;
          [key: string]: unknown;
        } & ThisType<Instance<TData>>
      ): void;
    }
  }
}

declare const App: WechatMiniprogram.App.Constructor;
declare const Page: WechatMiniprogram.Page.Constructor;

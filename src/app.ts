import Config from './config';
import moment from 'moment';
import { RequestConfig, ErrorShowType } from 'umi';

// moment
if (moment) {
  moment.locale('zh-cn');
}

export const dva = {
  config: {
    onError(err: any) {
      err.preventDefault();
      console.error(err.message);
    },
  },
};

// request
export const request: RequestConfig = {
  timeout: 5 * 10000,
  errorConfig: {
    adaptor: (preData: any) => {
      let result: any = {
        showType: ErrorShowType.ERROR_MESSAGE,
      };

      try {
        result = {
          ...result,
          errorMessage: preData?.message,
          ...preData,
        };
      } catch (e) {
        result = {
          ...result,
          success: false,
          errorMessage: '响应数据格式解析错误',
        };
      }
      return result;
    },
  },
  middlewares: [
    async (ctx: any, next: any) => {
      await next();
    },
  ],
  requestInterceptors: [
    // 默认请求头
    (url: string, options: any) => {
      let baseUrl = Config.getBaseUrl();
      if (baseUrl === '/') {
        baseUrl = window.location.origin;
      }
      url = `${baseUrl}${url}`;
      console.debug('[请求拦截器]::', '附带请求头');
      const defaultOptions = {
        credentials: 'include',
      };
      const newOptions = {
        ...defaultOptions,
        ...options,
      } as any;

      if (Config.isDev()) {
        newOptions.headers['X-Username'] = 'hocgin';
      }

      if (newOptions?.data instanceof FormData) {
        // newOptions.body is FormData
        newOptions.headers = {
          Accept: 'application/json',
          ...newOptions.headers,
        };
      } else {
        newOptions.headers = {
          'X-Page-Url': window.location.href,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json; charset=UTF-8',
          Origin: url,
          ...newOptions.headers,
        };
      }

      return { url, options: newOptions };
    },
  ],
  responseInterceptors: [
    // 认证检查
    (response: Response, options: any) => {
      console.debug('[响应拦截器]::', '认证检查');
      if (response.status === 401) {
        response.clone().json().then(({ redirectUrl }: any) => {
          window.location.href = `${Config.getSsoServerUrl()}?redirectUrl=${
            redirectUrl ?? window.location.href
          }`;
        });
        throw new Error('认证失败');
      }
      return response;
    },
    async (response: Response, options: any) => {
      try {
        await response.clone().json();
      } catch (e) {
        throw new Error('响应数据格式解析错误');
      }
      return response;
    },
  ],
};

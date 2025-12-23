import { forwardRef, useImperativeHandle, useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Modal, { type ModalType } from '@/components/common/Modal';
import WebView from 'react-native-webview';
import { useTheme } from '@/store/theme/hook';
import { useStatusbarHeight } from '@/store/common/hook';
import { Icon } from '@/components/common/Icon';
import Text from '@/components/common/Text';
import { toast } from '@/utils/tools';
import { httpFetch } from '@/utils/request';
import BackgroundTimer from 'react-native-background-timer';

export interface BilibiliLoginModalType {
  show: () => void;
}

const GENERATE_URL = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate';
const POLL_URL = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll';

const Header = ({ onClose }: { onClose: () => void }) => {
  const theme = useTheme();
  const statusBarHeight = useStatusbarHeight();

  return (
    <View style={[styles.header, { height: 50 + statusBarHeight, paddingTop: statusBarHeight, backgroundColor: theme['c-content-background'] }]}>
      <TouchableOpacity onPress={onClose} style={styles.backButton}>
        <Icon name="chevron-left" size={24} color={theme['c-font']} />
      </TouchableOpacity>
      <Text size={18}>Bilibili 扫码登录</Text>
      <View style={styles.backButton} />
    </View>
  );
};

export default forwardRef<BilibiliLoginModalType, {}>((props, ref) => {
  const modalRef = useRef<ModalType>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const qrcodeKeyRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const theme = useTheme();
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    show() {
      modalRef.current?.setVisible(true);
      loadQRCode();
    },
  }));

  const loadQRCode = async () => {
    setLoading(true);
    setStatusText('正在获取二维码...');
    try {
      const res = await httpFetch(GENERATE_URL).promise;
      if (res.body.code === 0) {
        if (!isMountedRef.current) return;
        setUrl(res.body.data.url);
        qrcodeKeyRef.current = res.body.data.qrcode_key;
        startPolling();
        setLoading(false);
        setStatusText('请使用 Bilibili App 扫码登录');
      } else {
        if (!isMountedRef.current) return;
        setStatusText('获取二维码失败: ' + res.body.message);
        setLoading(false);
      }
    } catch (e: any) {
      if (!isMountedRef.current) return;
      setStatusText('获取二维码出错: ' + e.message);
      setLoading(false);
    }
  };

  const startPolling = () => {
    stopPolling();
    timerRef.current = BackgroundTimer.setInterval(pollStatus, 3000);
  };

  const stopPolling = () => {
    if (timerRef.current !== null) {
      BackgroundTimer.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pollStatus = async () => {
    if (!qrcodeKeyRef.current) return;
    try {
      const res = await httpFetch(`${POLL_URL}?qrcode_key=${qrcodeKeyRef.current}`).promise;
      const data = res.body.data;
      if (data.code === 0) {
        // Login Success
        stopPolling();
        toast('登录成功');
        
        // Extract cookies
        let cookieStr = '';
        const setCookie = res.headers['set-cookie'] || res.headers['Set-Cookie'];
        if (setCookie) {
             if (Array.isArray(setCookie)) {
                 cookieStr = setCookie.join('; ');
             } else {
                 cookieStr = setCookie;
             }
        }
        
        global.app_event['bi-cookie-set'](cookieStr);
        handleClose();
      } else if (data.code === 86038) {
        setStatusText('二维码已失效，请重新打开');
        stopPolling();
      } else if (data.code === 86090) {
        setStatusText('扫描成功，请在手机上确认');
      }
    } catch (e) {
      // ignore
    }
  };

  const handleClose = useCallback(() => {
    stopPolling();
    modalRef.current?.setVisible(false);
  }, []);

  return (
    <Modal ref={modalRef} onHide={stopPolling} statusBarPadding={false} bgHide={false}>
      <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
        <Header onClose={handleClose} />
        <View style={styles.content}>
           {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme['c-primary']} />
                <Text style={{marginTop: 10, color: theme['c-font']}}>加载中...</Text>
              </View>
           ) : url ? (
              <WebView
                source={{ uri: url }}
                style={{ flex: 1 }}
                userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54"
              />
           ) : null}
           <Text style={[styles.status, { color: theme['c-font'] }]}>{statusText}</Text>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
    width: 40,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    textAlign: 'center',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    zIndex: 10,
  }
});

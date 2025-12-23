import { memo, useEffect, useRef } from 'react';
import { View } from 'react-native';
import InputItem, { type InputItemProps } from '../../components/InputItem';
import { useSettingValue } from '@/store/setting/hook';
import { updateSetting } from '@/core/common';
import { createStyle } from '@/utils/tools';
import Button from '../../components/Button';
import BilibiliLoginModal, { type BilibiliLoginModalType } from '@/components/BilibiliLoginModal';

export default memo(() => {
  const cookie = useSettingValue('common.bi_cookie');
  const modalRef = useRef<BilibiliLoginModalType>(null);

  const setCookie = (val: string) => {
    updateSetting({ 'common.bi_cookie': val });
  };

  const handleChanged: InputItemProps['onChanged'] = (text, callback) => {
    callback(text);
    setCookie(text);
  };

  const handleShowLoginModal = () => {
    modalRef.current?.show();
  };

  useEffect(() => {
    const handleCookieSet = (cookie: string) => {
      setCookie(cookie);
    };

    global.app_event.on('bi-cookie-set', handleCookieSet);
    return () => {
      global.app_event.off('bi-cookie-set', handleCookieSet);
    };
  }, []);

  return (
    <View style={styles.content}>
      <InputItem
        value={cookie}
        label="Bilibili Cookie"
        onChanged={handleChanged}
        placeholder="在此处粘贴你的 Cookie"
      />
      <View style={styles.btnContainer}>
        <Button onPress={handleShowLoginModal}>扫码登录</Button>
      </View>
      <BilibiliLoginModal ref={modalRef} />
    </View>
  );
});

const styles = createStyle({
  content: {
    // marginTop: 10,
  },
  btnContainer: {
    marginBottom: 5,
    paddingLeft: 20,
    flexDirection: 'row',
  },
});

package com.lxb.music.mobile.cache;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;

import static com.lxb.music.mobile.cache.Utils.clearCacheFolder;
import static com.lxb.music.mobile.cache.Utils.getDirSize;
import static com.lxb.music.mobile.cache.Utils.isMethodsCompat;

// https://github.com/midas-gufei/react-native-clear-app-cache/tree/master/android/src/main/java/com/learnta/clear
public class CacheModule extends ReactContextBaseJavaModule {
  private final CacheModule cacheModule;

  CacheModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.cacheModule = this;
  }

  @Override
  public String getName() {
    return "CacheModule";
  }


  @ReactMethod
  public void getAppCacheSize(Promise promise) {
    // 璁＄畻缂撳瓨澶у皬
    long fileSize = 0;
    // File filesDir = getReactApplicationContext().getFilesDir();// /data/data/package_name/files
    File cacheDir = getReactApplicationContext().getCacheDir();// /data/data/package_name/cache
    // fileSize += getDirSize(filesDir);
    fileSize += getDirSize(cacheDir);
    // 2.2鐗堟湰鎵嶆湁灏嗗簲鐢ㄧ紦瀛樿浆绉诲埌sd鍗＄殑鍔熻兘
    if (isMethodsCompat(android.os.Build.VERSION_CODES.FROYO)) {
      File externalCacheDir = Utils.getExternalCacheDir(getReactApplicationContext());//"<sdcard>/Android/data/<package_name>/cache/"
      fileSize += getDirSize(externalCacheDir);
    }

    promise.resolve(String.valueOf(fileSize));
  }

  //娓呴櫎缂撳瓨
  @ReactMethod
  public void clearAppCache(Promise promise) {
    CacheClearAsyncTask asyncTask = new CacheClearAsyncTask(cacheModule, promise);
    asyncTask.execute(10);
  }

  /**
   * 娓呴櫎app缂撳瓨
   */
  public void clearCache() {

    getReactApplicationContext().deleteDatabase("webview.db");
    getReactApplicationContext().deleteDatabase("webview.db-shm");
    getReactApplicationContext().deleteDatabase("webview.db-wal");
    getReactApplicationContext().deleteDatabase("webviewCache.db");
    getReactApplicationContext().deleteDatabase("webviewCache.db-shm");
    getReactApplicationContext().deleteDatabase("webviewCache.db-wal");
    //娓呴櫎鏁版嵁缂撳瓨
    // clearCacheFolder(getReactApplicationContext().getFilesDir(), System.currentTimeMillis());
    clearCacheFolder(getReactApplicationContext().getCacheDir(), System.currentTimeMillis());
    //2.2鐗堟湰鎵嶆湁灏嗗簲鐢ㄧ紦瀛樿浆绉诲埌sd鍗＄殑鍔熻兘
    if (isMethodsCompat(android.os.Build.VERSION_CODES.FROYO)) {
      clearCacheFolder(Utils.getExternalCacheDir(getReactApplicationContext()), System.currentTimeMillis());
    }

  }

}

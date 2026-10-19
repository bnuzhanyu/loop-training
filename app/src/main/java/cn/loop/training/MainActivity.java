package cn.loop.training;
import android.app.Activity;
import android.os.*;
import android.content.*;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.SoundPool;
import android.hardware.*;
import android.view.*;
import android.webkit.*;
import java.io.*;
import org.json.JSONObject;

public class MainActivity extends Activity implements SensorEventListener {
 private WebView web;
 private SoundPool soundPool;
 private final int[] sounds=new int[4];
 private final boolean[] soundReady=new boolean[4];
 private SensorManager sensors;
 private Sensor accelerometer,gravitySensor;
 private boolean sensorActive=false,hasGravity=false;
 private final double[] gravity=new double[3];
 private final MotionCounter counter=new MotionCounter();
 private long calibrateUntil=0;
 private double threshold=1.1;
 private final Handler handler=new Handler(Looper.getMainLooper());
 private android.content.SharedPreferences prefs;
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  prefs=getSharedPreferences("loop",MODE_PRIVATE);
  soundPool=new SoundPool.Builder().setMaxStreams(8).setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()).build();
  soundPool.setOnLoadCompleteListener((pool,id,status)->{for(int n=0;n<sounds.length;n++)if(sounds[n]==id)soundReady[n]=status==0;});
  String[] names={"up","down","glass","target"};
  for(int n=0;n<names.length;n++){try(android.content.res.AssetFileDescriptor fd=getAssets().openFd("sounds/"+names[n]+".wav")){sounds[n]=soundPool.load(fd,1);}catch(IOException e){android.util.Log.e("Loop","Sound unavailable: "+names[n],e);}}

  sensors=(SensorManager)getSystemService(SENSOR_SERVICE);
  accelerometer=sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
  gravitySensor=sensors.getDefaultSensor(Sensor.TYPE_GRAVITY);
  getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  getWindow().setStatusBarColor(Color.rgb(16,21,20));
  getWindow().setNavigationBarColor(Color.rgb(16,21,20));
  web=new WebView(this);web.setBackgroundColor(Color.rgb(16,21,20));
  web.setOnApplyWindowInsetsListener((v,insets)->{
   if(Build.VERSION.SDK_INT>=30){android.graphics.Insets i=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(i.left,i.top,i.right,i.bottom);}
   else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
   return insets;
  });
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);
  settings.setAllowFileAccessFromFileURLs(false);settings.setAllowUniversalAccessFromFileURLs(false);
  settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.addJavascriptInterface(new Bridge(),"Native");
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !r.getUrl().toString().equals("https://loop.local/index.html");}
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
    android.net.Uri u=r.getUrl();String path=u.getPath();
    if("https".equals(u.getScheme())&&"loop.local".equals(u.getHost())&&path!=null&&path.matches("/(index\\.html|app\\.js|core\\.js|effects\\.js|tools\\.js|training\\.js|picker\\.js|schedule\\.js|style\\.css)")){
     try {String mime=path.endsWith("html")?"text/html":path.endsWith("css")?"text/css":"application/javascript";return new WebResourceResponse(mime,"UTF-8",getAssets().open(path.substring(1)));}catch(IOException e){}
    }
    return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
   }
  });
  setContentView(web);web.loadUrl("https://loop.local/index.html");
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0,()->js("window.onBack&&window.onBack()"));
 }
 private void js(String code){handler.post(()->{if(web!=null)web.evaluateJavascript(code,null);});}
 public final class Bridge {
  @JavascriptInterface public String load(){return prefs.getString("data","");}
  @JavascriptInterface public synchronized boolean save(String s){if(s==null||s.length()>15000000)return false;return prefs.edit().putString("data",s).commit();}
  @JavascriptInterface public String loadDraft(){return prefs.getString("draft","");}
  @JavascriptInterface public void saveDraft(String s){if(s!=null&&s.length()<500000)prefs.edit().putString("draft",s).apply();}
  @JavascriptInterface public void copy(String s){handler.post(()->((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("循练",s)));}
  @JavascriptInterface public String paste(){ClipboardManager c=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);try{return c.hasPrimaryClip()?c.getPrimaryClip().getItemAt(0).coerceToText(MainActivity.this).toString():"";}catch(Exception e){return "";}}
  @JavascriptInterface public void pickValue(String request,String title,String unit,int min,int max,int initial){handler.post(()->showValuePicker(request,title,unit,min,max,initial));}
  @JavascriptInterface public void sound(int type){if(type<0||type>=sounds.length)return;handler.post(()->{if(soundPool!=null&&soundReady[type])soundPool.play(sounds[type],.65f,.65f,type==2?2:1,0,1f);});}
  @JavascriptInterface public boolean audioReady(){for(boolean ready:soundReady)if(!ready)return false;return true;}
  @JavascriptInterface public void trainingMode(boolean active){handler.post(()->{if(Build.VERSION.SDK_INT>=30){WindowInsetsController c=getWindow().getInsetsController();if(c!=null){c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);if(active)c.hide(WindowInsets.Type.systemBars());else c.show(WindowInsets.Type.systemBars());}}else{getWindow().getDecorView().setSystemUiVisibility(active?View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY:View.SYSTEM_UI_FLAG_VISIBLE);}});}
  @JavascriptInterface public void haptic(){handler.post(()->web.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP));}
  @JavascriptInterface public boolean sensor(boolean on,double sensitivity){if(accelerometer==null)return false;handler.post(()->setSensor(on,sensitivity));return true;}
  @JavascriptInterface public void minimize(){handler.post(()->moveTaskToBack(true));}
 }
 private android.widget.NumberPicker numberWheel(int min,int max,int value){android.widget.NumberPicker picker=new android.widget.NumberPicker(this);picker.setMinValue(min);picker.setMaxValue(max);picker.setValue(Math.max(min,Math.min(max,value)));picker.setWrapSelectorWheel(false);picker.setDescendantFocusability(android.widget.NumberPicker.FOCUS_BLOCK_DESCENDANTS);return picker;}
 private void showValuePicker(String request,String title,String unit,int min,int max,int initial){
  if(min<0||max<min||max>86400||request==null||request.length()>100)return;
  final boolean[] sent={false};
  java.util.function.Consumer<Integer> reply=value->{if(sent[0])return;sent[0]=true;js("window.onPickerResult&&window.onPickerResult("+JSONObject.quote(request)+","+value+")");};
  android.widget.LinearLayout content=new android.widget.LinearLayout(this);content.setOrientation(android.widget.LinearLayout.VERTICAL);int pad=(int)(20*getResources().getDisplayMetrics().density);content.setPadding(pad,0,pad,pad);
  android.widget.LinearLayout wheels=new android.widget.LinearLayout(this);wheels.setGravity(Gravity.CENTER);content.addView(wheels);
  final boolean timed="seconds".equals(unit);
  android.widget.NumberPicker first=numberWheel(timed?0:min,timed?24:max,timed?initial/3600:initial);
  android.widget.NumberPicker minutes=numberWheel(0,59,(initial/60)%60),seconds=numberWheel(0,59,initial%60);
  android.widget.NumberPicker[] pickers=timed?new android.widget.NumberPicker[]{first,minutes,seconds}:new android.widget.NumberPicker[]{first};
  String[] labels=timed?new String[]{"时","分","秒"}:new String[]{"days".equals(unit)?"天":"次"};
  for(int n=0;n<pickers.length;n++){android.widget.LinearLayout col=new android.widget.LinearLayout(this);col.setOrientation(android.widget.LinearLayout.VERTICAL);col.setGravity(Gravity.CENTER);android.widget.TextView label=new android.widget.TextView(this);label.setText(labels[n]);label.setTextSize(14);col.addView(label);col.addView(pickers[n]);wheels.addView(col,new android.widget.LinearLayout.LayoutParams(0,-2,1));}
  android.widget.EditText manual=new android.widget.EditText(this);manual.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);manual.setSingleLine(true);manual.setText(String.valueOf(initial));manual.setHint(timed?"总秒数":"days".equals(unit)?"天数":"次数");manual.setVisibility(View.GONE);content.addView(manual);
  android.widget.Button switchMode=new android.widget.Button(this);switchMode.setText("手动输入");content.addView(switchMode);
  android.app.AlertDialog dialog=new android.app.AlertDialog.Builder(this).setTitle(title).setView(content).setNegativeButton("取消",(d,w)->reply.accept(-1)).setPositiveButton("确定",null).create();
  switchMode.setOnClickListener(v->{boolean enter=manual.getVisibility()!=View.VISIBLE;if(enter){int current=timed?first.getValue()*3600+minutes.getValue()*60+seconds.getValue():first.getValue();manual.setText(String.valueOf(current));}manual.setVisibility(enter?View.VISIBLE:View.GONE);wheels.setVisibility(enter?View.GONE:View.VISIBLE);switchMode.setText(enter?"滚动选择":"手动输入");android.view.inputmethod.InputMethodManager keyboard=(android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);if(enter){manual.requestFocus();manual.selectAll();keyboard.showSoftInput(manual,android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);}else{keyboard.hideSoftInputFromWindow(manual.getWindowToken(),0);try{int value=Integer.parseInt(manual.getText().toString());if(value>=min&&value<=max){first.setValue(timed?value/3600:value);if(timed){minutes.setValue(value/60%60);seconds.setValue(value%60);}}}catch(Exception ignored){}}});
  dialog.setOnCancelListener(d->reply.accept(-1));
  dialog.setOnShowListener(d->dialog.getButton(android.app.AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{int value;try{value=manual.getVisibility()==View.VISIBLE?Integer.parseInt(manual.getText().toString()):timed?first.getValue()*3600+minutes.getValue()*60+seconds.getValue():first.getValue();}catch(Exception e){manual.setError("请输入整数");return;}if(value<min||value>max){if(manual.getVisibility()==View.VISIBLE)manual.setError("范围 "+min+"～"+max);else android.widget.Toast.makeText(this,"请选择 "+min+"～"+max+" 之间的数值",android.widget.Toast.LENGTH_SHORT).show();return;}reply.accept(value);dialog.dismiss();}));dialog.show();
 }

 private void setSensor(boolean on,double sensitivity){
  sensors.unregisterListener(this);sensorActive=false;hasGravity=false;counter.reset();
  if(!on)return;
  threshold=Math.max(.5,Math.min(3,sensitivity));
  gravity[0]=gravity[1]=gravity[2]=0;calibrateUntil=SystemClock.elapsedRealtime()+2000;
  if(gravitySensor!=null)hasGravity=sensors.registerListener(this,gravitySensor,SensorManager.SENSOR_DELAY_GAME);
  sensorActive=sensors.registerListener(this,accelerometer,SensorManager.SENSOR_DELAY_GAME);
  js("window.onSensorMessage("+JSONObject.quote(sensorActive?"保持起始姿势 2 秒；手机需安全固定并随身体运动。":"无法启动传感器，请使用点击计数。")+")");
  if(sensorActive)handler.postDelayed(()->{if(sensorActive)js("window.onSensorMessage('感应中 · 先慢做几次对照计数，必要时调整灵敏度。')");},2100);
 }
 @Override public void onSensorChanged(SensorEvent e){
  if(!sensorActive)return;
  if(e.sensor.getType()==Sensor.TYPE_GRAVITY){for(int i=0;i<3;i++)gravity[i]=e.values[i];return;}
  if(!hasGravity){double norm=Math.sqrt(gravity[0]*gravity[0]+gravity[1]*gravity[1]+gravity[2]*gravity[2]);for(int i=0;i<3;i++)gravity[i]=norm<1?e.values[i]:.98*gravity[i]+.02*e.values[i];}
  long now=SystemClock.elapsedRealtime();if(now<calibrateUntil)return;
  double norm=Math.sqrt(gravity[0]*gravity[0]+gravity[1]*gravity[1]+gravity[2]*gravity[2]);if(norm<1)return;
  double vertical=0;for(int i=0;i<3;i++)vertical+=(e.values[i]-gravity[i])*gravity[i]/norm;
  if(counter.accept(vertical,now,threshold))js("window.onSensorRep&&window.onSensorRep()");
 }
 @Override public void onAccuracyChanged(Sensor s,int a){}
 @Override protected void onPause(){js("window.onAppPause&&window.onAppPause()");setSensor(false,threshold);super.onPause();}
 @Override public void onBackPressed(){js("window.onBack&&window.onBack()");}
 @Override protected void onDestroy(){setSensor(false,threshold);handler.removeCallbacksAndMessages(null);if(soundPool!=null){soundPool.release();soundPool=null;}if(web!=null){web.removeJavascriptInterface("Native");web.destroy();web=null;}super.onDestroy();}
}

package cn.loop.training;
/** Experimental vertical movement cycle detector. No claim of exercise classification. */
public final class MotionCounter {
 private int phase=0;
 private long phaseAt=0,lastRep=0;
 public void reset(){phase=0;phaseAt=0;lastRep=0;}
 public boolean accept(double vertical,long ms,double threshold){
  if(phase!=0&&ms-phaseAt>5000)phase=0;
  if(ms-lastRep<900)return false;
  if(phase==0&&vertical < -threshold){phase=1;phaseAt=ms;}
  else if(phase==1&&vertical>threshold&&ms-phaseAt>=100){phase=2;}
  else if(phase==2&&Math.abs(vertical)<threshold*.6&&ms-phaseAt>=500){phase=0;lastRep=ms;return true;}
  return false;
 }
}

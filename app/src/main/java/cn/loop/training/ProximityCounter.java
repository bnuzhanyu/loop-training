package cn.loop.training;
/** Counts one approach after a stable withdrawal; startup while covered is ignored. */
public final class ProximityCounter {
 private long farSince=-1,lastRep=-1;
 private boolean near=false;
 public void reset(){farSince=-1;lastRep=-1;near=false;}
 public boolean accept(float distance,float maxRange,long now){
  if(!Float.isFinite(distance)||!Float.isFinite(maxRange)||distance<0||maxRange<=0)return false;
  boolean close=distance<Math.min(5f,maxRange);
  if(!close){if(near||farSince<0)farSince=now;near=false;return false;}
  if(near)return false;
  near=true;
  boolean count=farSince>=0&&now-farSince>=180&&(lastRep<0||now-lastRep>=450);
  farSince=-1;
  if(count)lastRep=now;
  return count;
 }
}

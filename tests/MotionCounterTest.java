import cn.loop.training.MotionCounter;
public class MotionCounterTest {
 public static void main(String[] args){MotionCounter c=new MotionCounter();int reps=0;
 for(int t=10000;t<12000;t+=20)if(c.accept(.2*Math.sin(t),t,1.1))reps++;
 if(reps!=0)throw new AssertionError("idle noise counted");
 if(c.accept(-2,12000,1.1)||c.accept(2,12200,1.1)||!c.accept(0,12600,1.1))throw new AssertionError("cycle missed");
 if(c.accept(-2,12700,1.1)||c.accept(2,12800,1.1)||c.accept(0,12900,1.1))throw new AssertionError("double count");
 c.reset();c.accept(-2,20000,1.1);if(c.accept(2,26000,1.1)||c.accept(0,26600,1.1))throw new AssertionError("stale cycle");
 System.out.println("PASS: idle rejection, full motion cycle, debounce, stale-cycle timeout. Hardware accuracy remains unverified.");}
}

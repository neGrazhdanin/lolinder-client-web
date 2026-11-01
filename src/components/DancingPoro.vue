<script setup lang="ts">
import { HeartIcon } from '@lucide/vue';
import { usePreferredReducedMotion } from '@vueuse/core';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ label: string }>();

const POROS = ['snax', 'snax-please', 'cuporo', 'bouncer', 'heartsteel', 'pentakill'];
const srcOf = (name: string) => `${import.meta.env.BASE_URL}poros/${name}.webp`;

const motion = usePreferredReducedMotion();
const current = ref(POROS[Math.floor(Math.random() * POROS.length)]!);
const hops = ref(0);
const hearts = ref<{ dx: string; tilt: string; delay: string }[]>([]);

let swap: ReturnType<typeof setTimeout> | undefined;

function next(): string {
  const others = POROS.filter((name) => name !== current.value);
  return others[Math.floor(Math.random() * others.length)]!;
}

function pet(): void {
  const poro = next();
  clearTimeout(swap);
  if (motion.value === 'reduce') {
    current.value = poro;
    return;
  }
  hops.value++;
  hearts.value = Array.from({ length: 5 }, (_, index) => ({
    dx: `${(index - 2) * 18 + Math.round(Math.random() * 10 - 5)}px`,
    tilt: `${(index - 2) * 12}deg`,
    delay: `${index * 35}ms`,
  }));
  // swapped at the top of the hop, where the change reads as a costume flip
  swap = setTimeout(() => (current.value = poro), 220);
}

onMounted(() => {
  for (const name of POROS) new Image().src = srcOf(name);
});
onBeforeUnmount(() => clearTimeout(swap));
</script>

<template>
  <button
    type="button"
    class="poro relative grid h-56 w-48 cursor-pointer place-items-end justify-items-center rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    :aria-label="props.label"
    :data-poro="current"
    @click="pet"
  >
    <span
      :key="`shadow-${hops}`"
      :class="['poro-shadow-hop mb-3', hops && 'is-hopping']"
      aria-hidden="true"
    >
      <span class="poro-shadow block h-3 w-28 rounded-[50%] bg-black/12 dark:bg-black/45" />
    </span>
    <span class="absolute inset-x-0 bottom-5 flex justify-center" aria-hidden="true">
      <span class="poro-breathe">
        <span class="poro-dance">
          <span :key="`hop-${hops}`" :class="['poro-hop', hops && 'is-hopping']">
            <img
              :src="srcOf(current)"
              alt=""
              width="200"
              height="200"
              draggable="false"
              class="size-36 object-contain select-none"
            />
          </span>
        </span>
      </span>
    </span>
    <span
      v-if="hearts.length"
      :key="`hearts-${hops}`"
      class="pointer-events-none absolute inset-x-0 top-6 flex justify-center"
      aria-hidden="true"
    >
      <HeartIcon
        v-for="(heart, index) in hearts"
        :key="index"
        class="poro-heart absolute size-3.5 fill-current text-primary"
        :style="{ '--dx': heart.dx, '--tilt': heart.tilt, animationDelay: heart.delay }"
      />
    </span>
  </button>
</template>

<style scoped>
/* Dance and breath loop at unrelated lengths so the motion never settles into one beat. */
.poro-dance,
.poro-breathe,
.poro-hop,
.poro-shadow,
.poro-shadow-hop {
  display: block;
  transform-origin: 50% 100%;
}

.poro-dance {
  animation: poro-dance 5.3s infinite;
}

.poro-breathe {
  animation: poro-breathe 3.1s ease-in-out infinite;
}

.poro-shadow {
  transform-origin: 50% 50%;
  animation: poro-shadow 5.3s infinite;
}

.poro-hop.is-hopping {
  animation: poro-hop 0.62s both;
}

.poro-shadow-hop {
  transform-origin: 50% 50%;
}

.poro-shadow-hop.is-hopping {
  animation: poro-shadow-hop 0.62s both;
}

.poro-heart {
  opacity: 0;
  animation: poro-heart 0.9s ease-out both;
}

@keyframes poro-dance {
  0%,
  100% {
    transform: translateY(0) rotate(0) scale(1, 1);
    animation-timing-function: ease-in-out;
  }
  9% {
    transform: rotate(-4deg) scale(1.02, 0.98);
    animation-timing-function: ease-in-out;
  }
  18% {
    transform: rotate(3deg) scale(0.99, 1.01);
    animation-timing-function: ease-in-out;
  }
  26% {
    transform: rotate(-1.5deg);
    animation-timing-function: ease-in;
  }
  31% {
    transform: translateY(0) scale(1.08, 0.92);
    animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  37% {
    transform: translateY(-18px) scale(0.95, 1.06);
    animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4);
  }
  43% {
    transform: translateY(0) scale(1.07, 0.93);
    animation-timing-function: ease-out;
  }
  47% {
    transform: translateY(0) scale(1, 1);
    animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  52% {
    transform: translateY(-9px) rotate(2deg) scale(0.97, 1.03);
    animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4);
  }
  56% {
    transform: translateY(0) rotate(0) scale(1.04, 0.96);
    animation-timing-function: ease-out;
  }
  61% {
    transform: scale(1, 1);
    animation-timing-function: ease-in-out;
  }
  71% {
    transform: rotate(5deg) scale(1.01, 0.99);
    animation-timing-function: ease-in-out;
  }
  81% {
    transform: rotate(-4deg);
    animation-timing-function: ease-in-out;
  }
  89% {
    transform: rotate(1deg);
    animation-timing-function: ease-in-out;
  }
  95% {
    transform: scale(1.03, 0.97);
    animation-timing-function: ease-in-out;
  }
}

@keyframes poro-shadow {
  0%,
  26%,
  47%,
  61%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  31%,
  43% {
    transform: scale(1.08);
  }
  37% {
    transform: scale(0.72);
    opacity: 0.6;
  }
  52% {
    transform: scale(0.85);
    opacity: 0.8;
  }
  56% {
    transform: scale(1.04);
  }
}

@keyframes poro-breathe {
  0%,
  100% {
    transform: scale(1, 1);
  }
  50% {
    transform: scale(1.012, 0.99);
  }
}

@keyframes poro-hop {
  0% {
    transform: translateY(0) scale(1, 1);
  }
  15% {
    transform: translateY(0) scale(1.12, 0.86);
    animation-timing-function: cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  40% {
    transform: translateY(-42px) rotate(-6deg) scale(0.92, 1.1);
    animation-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4);
  }
  72% {
    transform: translateY(0) rotate(2deg) scale(1.1, 0.9);
    animation-timing-function: ease-out;
  }
  100% {
    transform: translateY(0) rotate(0) scale(1, 1);
  }
}

@keyframes poro-shadow-hop {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  15%,
  72% {
    transform: scale(1.12);
  }
  40% {
    transform: scale(0.55);
    opacity: 0.45;
  }
}

@keyframes poro-heart {
  0% {
    opacity: 0;
    transform: translate(0, 24px) scale(0.4) rotate(0);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), -36px) scale(1) rotate(var(--tilt));
  }
}
</style>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import appScreenshot from './assets/app-screenshot.png'
import demoVideo from './assets/demo.mp4'
import logo from './assets/logo.png'

const displayedText = ref('')
const commands = [
  "When is my next free weekend?",
  "Reschedule my 3pm to tomorrow morning",
  "Add a lunch with Sarah on Tuesday at 12",
  "Clear my afternoon schedule for deep work"
]

let commandIndex = 0
let charIndex = 0
let isDeleting = false
let typingInterval = null

const typeCommand = () => {
  const currentCommand = commands[commandIndex]
  
  if (isDeleting) {
    displayedText.value = currentCommand.substring(0, charIndex - 1)
    charIndex--
  } else {
    displayedText.value = currentCommand.substring(0, charIndex + 1)
    charIndex++
  }

  let typeSpeed = isDeleting ? 30 : 50

  if (!isDeleting && charIndex === currentCommand.length) {
    typeSpeed = 2000 // Pause at end
    isDeleting = true
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false
    commandIndex = (commandIndex + 1) % commands.length
    typeSpeed = 500 // Pause before new typing
  }

  typingInterval = setTimeout(typeCommand, typeSpeed)
}

onMounted(() => {
  typeCommand()
})

onUnmounted(() => {
  if (typingInterval) clearTimeout(typingInterval)
})

const features = [
  {
    title: "Natural-language scheduling",
    desc: "Add, move, delete, and summarize events using plain English—with conflict-aware time reasoning.",
  },
  {
    title: "Different view options",
    desc: "Switch between day, week, month, and agenda views to visualize your schedule, or manually manage events just like a traditional calendar.",
  },
  {
    title: "Local & Private Database",
    desc: "Your data stays on your machine. All events are stored in a local database, ensuring your schedule is private and secure.",
  },
  {
    title: "Desktop-first experience",
    desc: "Electron app with a modern calendar UI and an integrated AI chat box.",
  },
]

const useCases = [
  {
    q: "When is June's birthday?",
    a: "Instantly retrieves specific details from your calendar history.",
  },
  {
    q: "Move my meeting on Friday to the next free 30 minutes",
    a: "Performs conflict resolution and updates the DB + UI.",
  },
  {
    q: "What did I spend the most time on last week?",
    a: "Runs RAG-style queries over event history and summarizes patterns.",
  },
]
</script>

<template>
  <div class="min-h-screen bg-white text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
    <!-- Top nav -->
    <header class="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <!-- Logo and Title -->
        <div class="flex items-center gap-3">
          <img :src="logo" alt="Logo" class="h-8 w-8 rounded-lg shadow-sm" />
          <div class="text-sm font-semibold tracking-wide text-zinc-900">Calendar LLM</div>
        </div>

        <!-- Centered Nav -->
        <nav class="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 gap-8 text-sm font-medium text-zinc-600 md:flex">
          <a class="hover:text-zinc-900 transition-colors" href="#features">Features</a>
          <a class="hover:text-zinc-900 transition-colors" href="#demo">Demo</a>
          <a class="hover:text-zinc-900 transition-colors" href="#download">Download</a>
        </nav>

        <!-- Right Side Action -->
        <div class="flex items-center gap-3">
          <a
            href="#download"
            class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors shadow-sm"
          >
            Get the app
          </a>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <!-- Reduced padding and managed max-height to fit fold -->
    <section class="relative overflow-hidden border-b border-zinc-100 pt-10 pb-16">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.03),transparent_40%),radial-gradient(circle_at_80%_40%,rgba(16,185,129,0.03),transparent_40%)]"></div>
      <div class="mx-auto max-w-7xl px-6 relative">
        <div class="flex flex-col items-center text-center max-w-4xl mx-auto mb-8">
            <h1 class="text-3xl font-semibold leading-tight md:text-5xl text-zinc-900 tracking-tight">
              A calendar that <span class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">understands you</span>.
            </h1>
            <p class="mt-4 text-sm text-zinc-500 md:text-base max-w-2xl">
              Manage your schedule at the speed of thought. Calendar LLM transforms natural language into actions—effortlessly adding, rescheduling, and summarizing your events.
            </p>
            <div class="mt-6 flex flex-col gap-3 sm:flex-row justify-center">
              <a
                href="#demo"
                class="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-all hover:scale-105 shadow-xl shadow-zinc-900/10"
              >
                Watch demo
              </a>
              <a
                href="#download"
                class="rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-105 shadow-sm"
              >
                Get the app
              </a>
            </div>

        </div>

        <div class="relative w-full max-w-5xl mx-auto">
          <div class="flex flex-col gap-6 text-center">
            
            <!-- Screenshot card (Constrained height/width to fit fold) -->
             <div class="mx-auto max-w-4xl">
              <div class="rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-2xl shadow-zinc-200/50 relative">
                  <img :src="appScreenshot" alt="Calendar LLM App Screenshot" class="rounded-xl border border-zinc-100 shadow-inner w-full h-auto" />
              </div>
            </div>

            <!-- Dynamic Command Text (Compact spacing) -->
            <div class="inline-flex items-center justify-center gap-2 text-lg md:text-2xl font-light text-zinc-600 font-mono min-h-[32px]">
                <span class="text-emerald-500">✨</span>
                <span>{{ displayedText }}</span>
                <span class="animate-pulse text-emerald-500">|</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="mx-auto max-w-6xl px-6 py-20">
      <div class="flex items-end justify-between gap-6">
        <div>
          <h2 class="text-3xl font-semibold text-zinc-900">Features</h2>
          <p class="mt-4 text-lg text-zinc-500">Everything a great assistant does—without leaving your calendar.</p>
        </div>
      </div>

      <div class="mt-12 grid gap-6 md:grid-cols-2">
        <div
          v-for="f in features"
          :key="f.title"
          class="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 hover:bg-white hover:shadow-lg transition-all duration-300"
        >
          <div class="text-xl font-semibold text-zinc-900">{{ f.title }}</div>
          <div class="mt-3 text-base text-zinc-500">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <!-- Demo -->
    <section id="demo" class="border-t border-zinc-100 bg-zinc-50">
      <div class="mx-auto max-w-7xl px-6 py-20">
        <div class="text-center mb-12">
           <h2 class="text-3xl font-semibold text-zinc-900">Demo</h2>
        </div>
        <div class="mx-auto max-w-6xl">
           <div class="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/50 ring-1 ring-zinc-200">
              <video 
                :src="demoVideo" 
                autoplay 
                muted 
                loop 
                playsinline 
                class="w-full"
              ></video>
           </div>
        </div>
      </div>
    </section>

    <!-- Use cases -->
    <section class="mx-auto max-w-6xl px-6 py-20">
      <h2 class="text-3xl font-semibold text-zinc-900">Example prompts</h2>
      <p class="mt-4 text-lg text-zinc-500">Real commands you can type into the app.</p>

      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <div v-for="u in useCases" :key="u.q" class="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div class="text-base font-semibold text-zinc-900">“{{ u.q }}”</div>
          <div class="mt-3 text-sm text-zinc-500">{{ u.a }}</div>
        </div>
      </div>
    </section>

    <!-- Download -->
    <section id="download" class="mx-auto max-w-6xl px-6 py-20 border-t border-zinc-100 bg-zinc-50">
      <div class="mb-12">
        <h2 class="text-3xl font-semibold text-zinc-900">Get Started</h2>
        <p class="mt-4 text-lg text-zinc-500">Follow these steps to install Calendar LLM on your Apple Silicon Mac.</p>
      </div>

      <div class="space-y-8 max-w-3xl">
        <!-- Step 1 -->
        <div class="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div class="flex items-start gap-4">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-semibold text-zinc-900">1</div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-zinc-900">Download the App</h3>
              <p class="mt-2 text-zinc-500">Get the latest version for macOS. <strong>Compatible with Apple Silicon only</strong>.</p>
              <div class="mt-6">
                 <a 
                   href="https://drive.google.com/file/d/1omoj4MdXSLVu4wDbN1t5oBFQnrfbwqbm/view?usp=sharing"
                   target="_blank"
                   class="inline-block bg-zinc-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors shadow-lg shadow-zinc-900/10"
                 >
                   Download .dmg
                 </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div class="flex items-start gap-4">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-semibold text-zinc-900">2</div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-zinc-900">Bypass Gatekeeper</h3>
              <p class="mt-2 text-zinc-500">Since the app is not yet notarized by Apple, you'll need to run this command in your Terminal after moving the app to your Applications folder:</p>
              <div class="mt-4 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-sm text-emerald-400 font-mono select-all shadow-inner">
                xattr -rd com.apple.quarantine /Applications/calendar-llm.app
              </div>
            </div>
          </div>
        </div>



      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-zinc-200 bg-white">
      <div class="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div class="text-sm text-zinc-500">
          © 2025 Calendar LLM • Built by Anush Somasundaram
        </div>
        <div class="flex gap-4">
          <a
            class="rounded-xl bg-zinc-900 border border-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 transition shadow-sm"
            href="https://github.com/AnushSomasundaram"
            target="_blank"
          >
            GitHub
          </a>
          <a
            class="rounded-xl bg-blue-600 border border-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition shadow-sm"
            href="https://www.linkedin.com/in/anushsom/"
            target="_blank"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

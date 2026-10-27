export default function LibraryScene() {
  return (
    <div className="library-scene" aria-hidden="true">
      <svg viewBox="0 0 580 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="library-hatch"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 8L8 0" stroke="#b99b5b" strokeOpacity=".13" />
          </pattern>
        </defs>
        <path
          d="M134 340V162a154 154 0 01308 0v178"
          fill="#101d1b"
          stroke="#806e49"
          strokeWidth="1.5"
        />
        <path
          d="M149 337V166a139 139 0 01278 0v171M288 28v270M159 151h258"
          stroke="#806e49"
        />
        <path
          d="M145 165L288 28l145 137M180 94l108 57 108-57"
          stroke="#806e49"
          strokeOpacity=".6"
        />
        <path
          d="M134 340V162a154 154 0 01308 0v178H134Z"
          fill="url(#library-hatch)"
        />
        <path
          d="M350 69a27 27 0 0033 41 28 28 0 01-33-41Z"
          fill="#d5ba79"
          opacity=".85"
        />
        <g fill="#d5ba79">
          <circle cx="222" cy="94" r="1.5" />
          <circle cx="326" cy="126" r="1" />
          <circle cx="399" cy="170" r="1.5" />
          <circle cx="180" cy="190" r="1" />
          <circle cx="246" cy="174" r="2" />
        </g>
        <g stroke="#b19b69" strokeWidth="1.1" fill="#172724">
          <path d="M180 290v-52h21v-39h23v91M187 238v-15l13-20 13 20v15M202 200l10-31 10 31M224 290v-70h28v-37h33v107M244 185l24-40 24 40M257 145v-21M285 290v-53h27v-54h30v107M302 184l25-43 25 43M327 141v-28M342 290v-65h25v-31h21v96M361 194l16-31 16 31M165 291h247" />
          <path
            d="M210 252v10m0 12v10m28-35v11m24-60v12m0 12v12m12-36v12m0 12v12m46-34v12m12-12v12m-12 14v12m12-12v12m43 7v12"
            stroke="#e7bd69"
            strokeWidth="3"
          />
        </g>
        <g className="floating-candle candle-one">
          <path d="M92 130v63h11v-63" fill="#ddcda9" stroke="#a18c5a" />
          <path
            className="candle-flame"
            d="M98 107c-13 19-3 27 0 26 12-1 6-15 0-26Z"
            fill="#ebc477"
          />
          <path d="M98 132v5" stroke="#3a3023" />
        </g>
        <g className="floating-candle candle-two">
          <path d="M466 95v80h12V95" fill="#ddcda9" stroke="#a18c5a" />
          <path
            className="candle-flame"
            d="M472 72c-13 19-3 27 0 26 12-1 6-15 0-26Z"
            fill="#ebc477"
          />
        </g>
        <g className="floating-candle candle-three">
          <path d="M413 25v38h7V25" fill="#ddcda9" />
          <path
            className="candle-flame"
            d="M416 10c-8 12-2 17 0 16 8 0 4-9 0-16Z"
            fill="#ebc477"
          />
        </g>
        <g className="scene-book">
          <path
            d="M104 323q84-43 184-4 96-39 190 4l-12 51q-102-19-178 3-80-22-170-3Z"
            fill="#50352a"
            stroke="#b59a62"
            strokeWidth="1.5"
          />
          <path
            d="M111 314q79-47 177-3 99-44 184 3l-13 49q-97-17-171 9-80-26-164-9Z"
            fill="#d6c6a0"
            stroke="#b59a62"
          />
          <path
            d="M288 311v61M125 326q82-35 149-2m-147 10q80-34 147-2m-145 10q80-30 145-2m29-16q76-32 149 2m-149 6q76-29 147 2m-147 6q74-24 145 2"
            stroke="#80704d"
            strokeOpacity=".65"
          />
          <path
            d="M288 314q85-59 172-27l-2 16q-95-21-170 16"
            fill="#e6dab9"
            stroke="#a18c5a"
          />
          <path
            d="M287 371l-6 26 13-8 10 8-3-28"
            fill="#7d3931"
            stroke="#b59a62"
          />
        </g>
        <g className="scene-quill" stroke="#bda46e">
          <path d="M449 324q16-104 68-116-5 74-68 116Z" fill="#2e4439" />
          <path d="M438 350l66-128m-44 89 28-7m-22-6 29-8m-19-5 25-8m-19-3 26-9m-22-3 22-6m-18-6 20-6" />
        </g>
        <path d="M73 374h432M103 382h371" stroke="#7c6c48" />
      </svg>
      <span className="scene-caption">A little wonder between the covers.</span>
    </div>
  );
}

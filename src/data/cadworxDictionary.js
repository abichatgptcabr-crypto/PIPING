// Diccionario de componentes CADWorx confirmados cruzando dos catálogos reales
// (Sal de Vida / Allkem y SAC23046) — Type, Category y ProgramCode son valores
// fijos del programa (confirmado: idénticos en ambos catálogos, sin relación
// entre sí). DataTable_ID NO se incluye a propósito: es local a cada catálogo,
// no un código universal — hay que definirlo en CADWorx al importar.
export const CADWORX_DICTIONARY = [
  {
    "name": "CAP_SW_3000",
    "long": "-1:52:CAP, SW, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 1,
    "category": 1,
    "programCode": 38
  },
  {
    "name": "CAP_TR_3000",
    "long": "-1:54:CAP, THRD, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 1,
    "category": 1,
    "programCode": 52
  },
  {
    "name": "CAP_BW",
    "long": "-1:48:CAP, BW, SS, ASTM A403-WP 316/316L-S, ASME B16.9;",
    "type": 1,
    "category": 1,
    "programCode": 12
  },
  {
    "name": "CPL_SW_3000",
    "long": "-1:57:COUPLING, SW, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 30,
    "category": 2,
    "programCode": 39
  },
  {
    "name": "CPL_RD_SW_3000",
    "long": "-1:55:COUPLING REDUCER, SW, 3000#, CS, ASTM A105, ASME B16.11;",
    "type": 32,
    "category": 2,
    "programCode": 118
  },
  {
    "name": "CPL_TR_3000",
    "long": "-1:59:COUPLING, THRD, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 30,
    "category": 2,
    "programCode": 53
  },
  {
    "name": "CPL_RD_TR_3000",
    "long": "-1:67:COUPLING REDUCER, THRD, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 32,
    "category": 2,
    "programCode": 119
  },
  {
    "name": "90L_SW_3000",
    "long": "-1:57:ELBOW 90, SW, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 4,
    "category": 4,
    "programCode": 29
  },
  {
    "name": "45L_SW_3000",
    "long": "-1:57:ELBOW 45, SW, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 4,
    "category": 4,
    "programCode": 32
  },
  {
    "name": "90L_BW",
    "long": "-1:62:ELBOW 90, BW, SCH 10S, SS, ASTM A403-WP 316/316L-W, ASME B16.9;",
    "type": 5,
    "category": 4,
    "programCode": 2
  },
  {
    "name": "45L_BW",
    "long": "-1:62:ELBOW 45, BW, SCH 10S, SS, ASTM A403-WP 316/316L-W, ASME B16.9;",
    "type": 5,
    "category": 4,
    "programCode": 5
  },
  {
    "name": "FLG_SW_150",
    "long": "-1:65:FLANGE SOCKET WELD, RF, 150#, SS, ASTM A182-F316/316L, ASME B16.5;",
    "type": 21,
    "category": 5,
    "programCode": 22
  },
  {
    "name": "FLG_BL_150",
    "long": "-1:59:FLANGE BLIND, RF, 150#, SS, ASTM A182-F316/316L, ASME B16.5;",
    "type": 25,
    "category": 5,
    "programCode": 20
  },
  {
    "name": "FLG_SO_150",
    "long": "-1:61:FLANGE SLIP ON, RF, 150#, SS, ASTM A182-F316/316L, ASME B16.5;",
    "type": 24,
    "category": 5,
    "programCode": 19
  },
  {
    "name": "BLT_150",
    "long": "-1:73:STUD BOLTS, ASTM A193, GR B8M STUD, W/ 2 HEAVY HEX NUTS, ASTM A194, GR 8M;",
    "type": 54,
    "category": 6,
    "programCode": 24
  },
  {
    "name": "GAS_150",
    "long": "-1:65:GASKET, RF/FF, 150#, NITRILE RUBBER GASKET, 1/8&quot; THK, ASME B16.21;",
    "type": 55,
    "category": 6,
    "programCode": 25
  },
  {
    "name": "WLD_0.0625IN",
    "long": "-1:8:WELD GAP;",
    "type": 56,
    "category": 6,
    "programCode": 173
  },
  {
    "name": "SOL_SW_3000",
    "long": "-1:40:SOCKOLET, 3000#, SS, ASTM A182-F316/316L;",
    "type": 34,
    "category": 8,
    "programCode": 60
  },
  {
    "name": "WOL_BW",
    "long": "-1:44:WELDOLET, SS, ASTM A182-F316/316L, MSS SP-97;",
    "type": 34,
    "category": 8,
    "programCode": 62
  },
  {
    "name": "PIP_BW",
    "long": "-1:50:PIPE, PE, SCH 40S, SS, SMLS, ASTM A312-TP 316/316L;",
    "type": 3,
    "category": 9,
    "programCode": 1
  },
  {
    "name": "NIP_TR",
    "long": "-1:52:NIPPLE, PE, SCH 40S, SS, SMLS, ASTM A312-TP 316/316L;",
    "type": 76,
    "category": 9,
    "programCode": 26
  },
  {
    "name": "SWG_CN_BW",
    "long": "-1:63:SWAGE CONC, PE, SCH 40S, SS, ASTM A403-WP 316/316L-S, MSS SP-95;",
    "type": 17,
    "category": 10,
    "programCode": 27
  },
  {
    "name": "SWG_EC_BW",
    "long": "-1:62:SWAGE ECC, PE, SCH 40S, SS, ASTM A403-WP 316/316L-S, MSS SP-95;",
    "type": 18,
    "category": 10,
    "programCode": 28
  },
  {
    "name": "CNC_BW",
    "long": "-1:66:REDUCER CONC, BW, SCH 10S, SS, ASTM A403-WP 316/316L-W, ASME B16.9;",
    "type": 15,
    "category": 10,
    "programCode": 10
  },
  {
    "name": "ECC_BW",
    "long": "-1:65:REDUCER ECC, BW, SCH 10S, SS, ASTM A403-WP 316/316L-W, ASME B16.9;",
    "type": 16,
    "category": 10,
    "programCode": 11
  },
  {
    "name": "TEE_SW_3000",
    "long": "-1:52:TEE, SW, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 9,
    "category": 14,
    "programCode": 33
  },
  {
    "name": "TEE_RD_SW_3000",
    "long": "-1:60:TEE REDUCER, SW, 3000#, SS, ASTM A182-F316/316L, ASME B16.11;",
    "type": 10,
    "category": 14,
    "programCode": 34
  },
  {
    "name": "TEE_BW",
    "long": "-1:57:TEE, BW, SCH 10S, SS, ASTM A403-WP 316/316L-W, ASME B16.9;",
    "type": 9,
    "category": 14,
    "programCode": 8
  },
  {
    "name": "TEE_RD_BW",
    "long": "-1:65:TEE REDUCER, BW, SCH 10S, SS, ASTM A403-WP 316/316L-W, ASME B16.9;",
    "type": 10,
    "category": 14,
    "programCode": 9
  },
  {
    "name": "BAL_SW_800",
    "long": "-1:58:BALL VLV, A182 F316/316L, 1500 CWP, 3-PC, SW, 316 BALL, LO;",
    "type": 40,
    "category": 17,
    "programCode": 64
  },
  {
    "name": "BAL_TR_800",
    "long": "-1:59:BALL VLV, A182 F316/316L, 1500 CWP, 3-PC, NPT, 316 BALL, LO;",
    "type": 40,
    "category": 17,
    "programCode": 65
  },
  {
    "name": "GAT_CP_SW_800",
    "long": "-1:55:GATE VLV, A182 316L, OS&amp;YB, API CL 800, SW, API 602, HW;",
    "type": 46,
    "category": 17,
    "programCode": 71
  },
  {
    "name": "GAT_FL_150",
    "long": "-1:68:GATE VLV, A351-CF8M, CLASS 150, RF, ASME B16.5, TRIM 12, API 600, HW;",
    "type": 46,
    "category": 17,
    "programCode": 70
  },
  {
    "name": "PLU_RP_FL_150",
    "long": "-1:36:PLUG VLV, SS A351-CF8M, 150#, RF, LO;",
    "type": 51,
    "category": 17,
    "programCode": 76
  },
  {
    "name": "BFY_LG_150",
    "long": "-1:56:BUTTERFLY VALVE,150#, ASTM A351 CF8M, EPDM SEAT, LUG, GO;",
    "type": 41,
    "category": 17,
    "programCode": 66
  },
  {
    "name": "CHK_FL_150_LG",
    "long": "-1:60:DUAL PLATE CHECK VLV, SS 351-CF8M, 150#, RF, DUAL PLATE, LUG;",
    "type": 42,
    "category": 17,
    "programCode": 67
  },
  {
    "name": "FLG_LJ_150",
    "long": "-1:50:FLANGE LAP JOINT, 150#, CS, ASTM A105N, ASME B16.5;",
    "type": 26,
    "category": 5,
    "programCode": 21
  },
  {
    "name": "STB_BW",
    "long": "-1:68:STUB END, LJ, SS, ASTM A403-WP 316/316L-W, ASME B16.9, short pattern;",
    "type": 20,
    "category": 5,
    "programCode": 16
  },
  {
    "name": "BAL_SP_FL_150",
    "long": "-1:64:BALL VALVE, 150#, RF, ASTM A 351 Type CF8M body, RPTEF seals, LO;",
    "type": 40,
    "category": 17,
    "programCode": 63
  },
  {
    "name": "DIAF_CPVC_150",
    "long": "-1:68:DIAPHRAGM VALVE, 150#, RF, ASTM A 351 CF8M,  EPDM/PTFE DIAPHRAGM, HW;",
    "type": 45,
    "category": 17,
    "programCode": 134
  },
  {
    "name": "EXP_FL_150",
    "long": "-1:28:JUNTA DE EXPANSION, 150#, RF;",
    "type": 59,
    "category": 12,
    "programCode": 102
  },
  {
    "name": "STR_FL_150",
    "long": "-1:33:STRAINERR, 150#, RF, SS A351-CF8M;",
    "type": 64,
    "category": 13,
    "programCode": 93
  },
  {
    "name": "90_SW_CPVC",
    "long": "-1:86:ELBOW 90, SW, SCH 80, CPVC, ASTM D1784, Minimum Cell Class 23447, CPVC 4120, ASTM F439;",
    "type": 5,
    "category": 4,
    "programCode": 29
  },
  {
    "name": "45_SW_CPVC",
    "long": "-1:86:ELBOW 45, SW, SCH 80, CPVC, ASTM D1784, Minimum Cell Class 23447, CPVC 4120, ASTM F439;",
    "type": 5,
    "category": 4,
    "programCode": 32
  },
  {
    "name": "BFY_WF_150",
    "long": "-1:92:BUTTERFLY VALVE, FF, 150#, CPVC body and disc w / lever operator, EPDM seat and packing , LO;",
    "type": 41,
    "category": 17,
    "programCode": 159
  },
  {
    "name": "BUS_SW_CPVC_80",
    "long": "-1:99:REDUCER BUSHING CONC., SW, SCH 80, CPVC, ASTM D1784, Minimum Cell Class 23447, CPVC 4120, ASTM F439;",
    "type": 19,
    "category": 10,
    "programCode": 37
  },
  {
    "name": "90L_BW_1.5_HDPE",
    "long": "-1:81:ELBOW 90, SDR 16.2 / Class 10, HDPE, PEX, DIN 16892/16893, R=1.5D, ONE FLARED END;",
    "type": 5,
    "category": 4,
    "programCode": 3
  },
  {
    "name": "SPC_150",
    "long": "-1:54:FIGURE 8 - BLIND, RF, 150#, CS, ASTM A105, ASME B16.48;",
    "type": 58,
    "category": 12,
    "programCode": 101
  },
  {
    "name": "30L_BW_HDPE",
    "long": "-1:51:ELBOW 30, BF,  HDPE, PE100, SDR 11, PN16, DIN 16963;",
    "type": 5,
    "category": 4,
    "programCode": 108
  },
  {
    "name": "LAT_BW",
    "long": "-1:48:TEE 45°, BF, HDPE, PE100, SDR 11, PN6, DIN 16963;",
    "type": 61,
    "category": 7,
    "programCode": 15
  },
  {
    "name": "GLB_FL_150",
    "long": "-1:59:GLOBE VALVE, 150#, RF, ASTM A351-CF8M BODY, ASME B 16.5, HW;",
    "type": 48,
    "category": 17,
    "programCode": 73
  },
  {
    "name": "FLG_WN_150",
    "long": "-1:102:FLANGE WELDING NECK, FF, 150#, GRP, Fiberglass Vinyl Ester Resin, ASTM C582, UV protection, ASME B16.5;",
    "type": 23,
    "category": 5,
    "programCode": 18
  },
  {
    "name": "90L_TR_3000",
    "long": "-1:47:ELBOW 90,NPT, 3000#, CS, ASTM A105, ASME B16.11;",
    "type": 4,
    "category": 4,
    "programCode": 43
  },
  {
    "name": "45L_TR_3000",
    "long": "-1:48:ELBOW 45, NPT, 3000#, CS, ASTM A105, ASME B16.11;",
    "type": 4,
    "category": 4,
    "programCode": 46
  },
  {
    "name": "FLG_TR_150",
    "long": "-1:52:FLANGE THREADED, FF, 150#, CS, ASTM A105, ASME B16.5;",
    "type": 66,
    "category": 5,
    "programCode": 23
  },
  {
    "name": "TOL_TR_3000",
    "long": "-1:49:THREDOLET, 3000#, NPT, CS, ASTM A105, ASME B16.11;",
    "type": 34,
    "category": 8,
    "programCode": 61
  },
  {
    "name": "TEE_TR_3000",
    "long": "-1:43:TEE, NPT, 3000#, CS, ASTM A105, ASME B16.11;",
    "type": 9,
    "category": 14,
    "programCode": 47
  },
  {
    "name": "TEE_RD_TR_3000",
    "long": "-1:51:TEE REDUCER, NPT, 3000#, CS, ASTM A105, ASME B16.11;",
    "type": 10,
    "category": 14,
    "programCode": 48
  },
  {
    "name": "UNN_TR_3000",
    "long": "-1:43:UNION, NPT, 3000#, CS, ASTM A105, MSS SP-83;",
    "type": 60,
    "category": 15,
    "programCode": 55
  },
  {
    "name": "CHK_TR_800",
    "long": "-1:68:CHECK VALVE, NPT,  BR ASTM B62, Swing Type, Body and Seat Alloy C836;",
    "type": 42,
    "category": 17,
    "programCode": 69
  },
  {
    "name": "",
    "long": "-1:51:BUTTERFLY VALVE, 150#, Wafer, CI EN-GJL-200 (GG-20);",
    "type": 43,
    "category": 17,
    "programCode": 0
  },
  {
    "name": "GAT_CP_TR_800",
    "long": "-1:57:GATE VALVE, NPT, 800#, BR ASTM B62, #175 WWP, OS&amp;Y, UL/FM;",
    "type": 46,
    "category": 17,
    "programCode": 72
  },
  {
    "name": "UNN_SW_3000",
    "long": "-1:57:UNION, SW, 3000#, CS, ASTM A105, integral seat, MSS SP-83;",
    "type": 60,
    "category": 15,
    "programCode": 41
  },
  {
    "name": "CHK_SW_800",
    "long": "-1:55:CHECK VALVE, CS A105 or A216-WCB, CLASS 800, SW, PISTON;",
    "type": 42,
    "category": 17,
    "programCode": 68
  },
  {
    "name": "CNT_FA_FL_150",
    "long": "-1:7:LCV-935;",
    "type": 44,
    "category": 17,
    "programCode": 90
  },
  {
    "name": "SWG_CN_BW",
    "long": "-1:65:SWAGE CONC, THRD, SCH 80, CS, ASTM A234 Gr. WPB-S GALV, MSS SP-95;",
    "type": 17,
    "category": 10,
    "programCode": 112
  },
  {
    "name": "SWG_EC_BW",
    "long": "-1:68:SWAGE ECC, THRD, SCH 80, CS, CS, ASTM A234 Gr. WPB-S GALV, MSS SP-95;",
    "type": 18,
    "category": 10,
    "programCode": 114
  },
  {
    "name": "",
    "long": "-1:58:PLUG, NPT, 3000#, GALV, ASTM A105, round head, ASME B16.11;",
    "type": 2,
    "category": 1,
    "programCode": 0
  },
  {
    "name": "BUS_TR_3000",
    "long": "-1:49:BUSHING, THRD, 3000#, GALV, ASTM A197, ASME B16.3;",
    "type": 19,
    "category": 10,
    "programCode": 51
  },
  {
    "name": "GLB_CP_TR_800",
    "long": "-1:132:GLOBE VALVE, CLASS 200, THREADED, BRONZE BODY ASTM B-62, BRONZE DISC, INSIDE SCREW&amp;#x000D;RISING STEM, SCREWED BONNET. HANDWHEEL OPERATED.;;",
    "type": 48,
    "category": 17,
    "programCode": 75
  },
  {
    "name": "PIP_BW_PPRC",
    "long": "-1:80:PIPE, PN16, BF,  PP-RC, Polypropylene Copolimer Random, DIN 8077/8078, DIN 16962;",
    "type": 3,
    "category": 9,
    "programCode": 125
  },
  {
    "name": "CNC_PEAD",
    "long": "-1:87:REDUCER CONC, PN16, SF, PP-RC, Polypropylene Copolimer Random, DIN 8077/8078, DIN 16962;",
    "type": 15,
    "category": 10,
    "programCode": 111
  },
  {
    "name": "ECC_PEAD",
    "long": "-1:86:REDUCER ECC, PN16, SF, PP-RC, Polypropylene Copolimer Random, DIN 8077/8078, DIN 16962;",
    "type": 16,
    "category": 10,
    "programCode": 113
  },
  {
    "name": "SWG_CN_BW",
    "long": "-1:48:SWAGE CONC, PE, SCH 80, CS, ASTM A105, MSS SP-95;",
    "type": 17,
    "category": 10,
    "programCode": 111
  },
  {
    "name": "SW_HC_3000",
    "long": "",
    "type": 31,
    "category": 2,
    "programCode": 40
  },
  {
    "name": "TR_HC_3000",
    "long": "",
    "type": 31,
    "category": 2,
    "programCode": 54
  },
  {
    "name": "BW_45LR_EL",
    "long": "",
    "type": 4,
    "category": 4,
    "programCode": 5
  },
  {
    "name": "BW_90LR_EL",
    "long": "",
    "type": 4,
    "category": 4,
    "programCode": 2
  },
  {
    "name": "PADDLE_SPACER_RF_150",
    "long": "",
    "type": 57,
    "category": 12,
    "programCode": 42
  },
  {
    "name": "THRD_STRAINER_1500",
    "long": "",
    "type": 64,
    "category": 13,
    "programCode": 95
  },
  {
    "name": "LATROLET_BW_XS",
    "long": "",
    "type": 35,
    "category": 8,
    "programCode": 122
  },
  {
    "name": "EL_BW",
    "long": "",
    "type": 33,
    "category": 8,
    "programCode": 59
  },
  {
    "name": "NIP_OLET_TR",
    "long": "",
    "type": 36,
    "category": 8,
    "programCode": 123
  },
  {
    "name": "NIP-OLET_SW",
    "long": "",
    "type": 36,
    "category": 8,
    "programCode": 124
  },
  {
    "name": "SWG_ECCENTRIC",
    "long": "-1:44:SWAGE ECC, SW X THRD, SCH 80 x 80, ASTM A105;",
    "type": 18,
    "category": 10,
    "programCode": 113
  },
  {
    "name": "HEX HEAD PLUG",
    "long": "-1:37:HEX HEAD PLUG, THRD, #3000, ASTM A105;",
    "type": 2,
    "category": 1,
    "programCode": 56
  },
  {
    "name": "NEEDLE_FLD_150",
    "long": "-1:109:VÁLVULA AGUJA, #150 RF, CUERPO Y BONETE ASTM A105 o A216 WCB, BONETE ABULONADO, VÁSTAGO Y VOLANTE ASCENDENTES;",
    "type": 49,
    "category": 17,
    "programCode": 82
  },
  {
    "name": "NEEDLE_5000_WOG",
    "long": "-1:115:VÁLVULA AGUJA, NPT, 5000 WOG, CUERPO Y BONETE ASTM A105 o A216 WCB, BONETE ABULONADO, VÁSTAGO Y VOLANTE ASCENDENTES;",
    "type": 49,
    "category": 17,
    "programCode": 83
  },
  {
    "name": "CHK_WF_150",
    "long": "-1:147:VÁLVULA RETENCIÓN, #150 RF, WAFER DUO/SINGLE CHECK, CUERPO ASTM A216 WCB, INT. AISI 316, RESORTE INCONEL X750, OPERACIÓN HORIZONTAL o ASC. VERTICAL;",
    "type": 42,
    "category": 17,
    "programCode": 160
  },
  {
    "name": "REL_POV_FGD_150",
    "long": "-1:40:VÁLVULA DE ALIVIO, SL, #150 RF x #150 RF;",
    "type": 52,
    "category": 17,
    "programCode": 79
  },
  {
    "name": "PI horizontal",
    "long": "-1:13:PI-horizontal;",
    "type": 80,
    "category": 16,
    "programCode": 103
  },
  {
    "name": "WN_LONG_150_PRFV",
    "long": "",
    "type": 22,
    "category": 5,
    "programCode": 17
  },
  {
    "name": "CNC_BW",
    "long": "-1:62:RED CONC, BW x THRD, SCH 80 x 40, ASTM A234 Gr. WPB Galvanized;",
    "type": 15,
    "category": 10,
    "programCode": 152
  },
  {
    "name": "PLUG_RP_NPT_800",
    "long": "-1:72:VÁLVULA TAPÓN, NPT, #800, ASTM A105 o A216 WCB, SELLOS PTFE, OP. PALANCA;",
    "type": 51,
    "category": 17,
    "programCode": 78
  },
  {
    "name": "BW_90SR_EL",
    "long": "",
    "type": 4,
    "category": 4,
    "programCode": 3
  }
];

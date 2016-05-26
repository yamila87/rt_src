//INFO: encripcion compatible con sjcl en la web, ver encriptar_rSAFE_javacomp en librt.web.js , asi podemos encriptar en el servidor y desencriptar en el cliente

import java.nio.file.Files;
import java.nio.file.Paths;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.security.*;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.encoders.Hex;
import org.bouncycastle.crypto.params.CCMParameters;
import org.bouncycastle.crypto.params.KeyParameter;
import org.bouncycastle.crypto.engines.AESFastEngine;
import org.bouncycastle.crypto.modes.CCMBlockCipher;
import java.util.Random;

public class LibRtCrypto {
	public static Random random= new Random();
	public static byte[][] IvCache= new byte[10][];

	public static byte[] hexToBytes(String hex) { return Hex.decode(hex); }

	public static byte[] secureRandomBytes(int cnt) { //U: para generar iv (cnt=7) o key para AES128 (cnt=16)
		byte[] r= new byte[cnt];
		SecureRandom random = new SecureRandom();
		random.nextBytes(r);
		return r;
	}

	public static String encriptarSAFE_plano(String data, byte[] key) throws Exception {
		int ivIdx= random.nextInt(IvCache.length);
		byte[] iv= IvCache[ivIdx];
		if (iv==null) { iv= secureRandomBytes(7); IvCache[ivIdx]= iv; };

		IvParameterSpec ivParameterSpec = new IvParameterSpec(iv);
		CCMParameters ccmParams= new CCMParameters( new KeyParameter(key), 64, iv, null);
		CCMBlockCipher ccmMode = new CCMBlockCipher(new AESFastEngine());
		ccmMode.init(true, ccmParams);

		//A: tenemos configurado el encriptador
		byte[] dataBytes= data.getBytes("UTF-8");
		byte[] byteCipherText= new byte[ ccmMode.getOutputSize(dataBytes.length) ]; 
		int res= ccmMode.processBytes(dataBytes,0,dataBytes.length,byteCipherText,0);
		ccmMode.doFinal(byteCipherText,res);
		//A: byteCipherText tiene los datos encriptados

		return LibRt.enc_base64(iv)+"_"+LibRt.enc_base64(byteCipherText); //A: compatible con encriptar_rSAFE_javacomp en librt.web
	}
}

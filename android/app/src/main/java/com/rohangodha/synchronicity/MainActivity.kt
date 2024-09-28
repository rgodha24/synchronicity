package com.rohangodha.synchronicity

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.rohangodha.synchronicity.ui.theme.SynchronicityTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        Log.i("MainActivity", "HELLO???");
        setContent {
            SynchronicityTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        App(getToken())
                        Button(onClick = { println(getToken()) }) {
                            Text(text = "print token")
                        }
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        println("new intent")
        super.onNewIntent(intent)
        handleDeepLink(intent)?.let { token ->
            storeToken(token)
        }
    }

    fun storeToken(token: String) {
        val prefs = this.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val edit = prefs.edit();
        edit.putString("token", token);
        edit.apply()
    }

    fun getToken(): String? {
        val token = getSharedPreferences("prefs", Context.MODE_PRIVATE).getString("token", "")
        if (token == "") {
            return null
        } else {
            return token
        }
    }
}

@Composable
fun App(token: String?) {
    val context = LocalContext.current
    if (token != null) {
        return Text(text = "Logged in!")
    }

    Button(onClick = { startAuth(context) }) {
        Text(text = "Login with Spotify")
    }
}

fun startAuth(context: Context) {
    Log.i("MainActivity", "trying to go to url??");
    println("trying to start context??")
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("http://10.0.2.2:3000/auth/login"))
    context.startActivity(intent)

}

fun handleDeepLink(intent: Intent?): String? {
    Log.i("MainActivity", "trying to handle deeplink")
    intent?.data?.let { uri ->
        if (uri.scheme == "synchronicity" && uri.host == "auth") {
            val token = uri.getQueryParameter("token")
            println(token)
            return token
        }
    }
    return null
}